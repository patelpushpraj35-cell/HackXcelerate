import os
import cv2
import numpy as np
import tensorflow as tf
import logging
from app.ai.preprocess import detect_faces, crop_face, preprocess_face
from app.utils.config import settings

# Configure logger
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def find_last_conv_layer(model: tf.keras.Model) -> str:
    """
    Dynamically searches the model to find the last convolutional layer name.
    Works for both Xception and MobileNetV2.
    
    Args:
        model (tf.keras.Model): The loaded Keras model.
        
    Returns:
        str: Name of the last convolutional layer.
    """
    # Iterate backwards through layers to find a convolutional layer
    for layer in reversed(model.layers):
        # Check if layer is a Conv2D, SeparableConv2D or has conv in its class/name
        layer_class = layer.__class__.__name__
        if "conv" in layer_class.lower() or "conv" in layer.name.lower():
            # If the model has nested layers (e.g., base model as a single layer)
            if hasattr(layer, 'layers'):
                for sub_layer in reversed(layer.layers):
                    sub_class = sub_layer.__class__.__name__
                    if "conv" in sub_class.lower() or "conv" in sub_layer.name.lower():
                        return sub_layer.name
            return layer.name
            
    # Hardcoded fallbacks if search fails
    if "xception" in model.name.lower():
        return "block14_sepconv2_act"
    elif "mobilenet" in model.name.lower():
        return "out_relu"
        
    raise ValueError("Could not find a convolutional layer in the model.")

def generate_gradcam(model: tf.keras.Model, preprocessed_image: np.ndarray, 
                     last_conv_layer_name: str = None) -> np.ndarray:
    """
    Computes Grad-CAM heatmap for a given preprocessed image.
    
    Args:
        model (tf.keras.Model): Compiled Keras model.
        preprocessed_image (np.ndarray): Preprocessed image tensor, shape (1, 224, 224, 3).
        last_conv_layer_name (str): Name of the convolutional layer. If None, resolves dynamically.
        
    Returns:
        np.ndarray: 2D float32 heatmap grid normalized to [0, 1].
    """
    if last_conv_layer_name is None:
        last_conv_layer_name = find_last_conv_layer(model)
        logger.info(f"Using dynamically resolved last convolutional layer: {last_conv_layer_name}")

    try:
        # Create a sub-model that outputs the last conv layer activation and final prediction
        grad_model = tf.keras.models.Model(
            inputs=[model.inputs],
            outputs=[model.get_layer(last_conv_layer_name).output, model.output]
        )
    except Exception as e:
        logger.error(f"Error creating Grad-CAM model: {str(e)}")
        # If there's an error due to nested models, try finding layer inside nested base model
        # Typically the base model is model.layers[1] or similar
        base_layer = None
        for l in model.layers:
            if hasattr(l, 'layers') and len(l.layers) > 0:
                base_layer = l
                break
        
        if base_layer:
            logger.info(f"Searching nested model: {base_layer.name}")
            nested_output = base_layer.get_layer(last_conv_layer_name).output
            # Construct model wrapping base layer inputs
            grad_model = tf.keras.models.Model(
                inputs=[model.inputs],
                outputs=[nested_output, model.output]
            )
        else:
            raise e

    # Record operations for automatic differentiation
    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(preprocessed_image)
        # Class index is 0 (binary sigmoid output represents FAKE probability)
        # We want to track the gradients of the prediction score
        score = predictions[0]

    # Compute gradients of the score with respect to the convolutional feature map output
    grads = tape.gradient(score, conv_outputs)

    # Vector of mean intensity of gradient per channel (Global Average Pooling on Gradients)
    # shape: [C] where C is number of channels
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    # Weight the 2D feature map channels by the gradient importance weights
    # shape: [H, W, C] -> we multiply each channel by its pooled gradient weight
    conv_outputs = conv_outputs[0]
    heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)

    # Apply ReLU (we only care about features that positively contribute to the target class)
    heatmap = tf.maximum(heatmap, 0.0)

    # Normalize heatmap between 0 and 1
    max_val = tf.math.reduce_max(heatmap)
    if max_val > 0.0:
        heatmap = heatmap / max_val
    else:
        heatmap = tf.zeros_like(heatmap)

    return heatmap.numpy()

def create_forensic_overlay(original_image: np.ndarray, heatmap: np.ndarray, 
                            bbox: list = None, alpha: float = 0.5) -> np.ndarray:
    """
    Superimposes the Grad-CAM heatmap onto the original image.
    If a bounding box is provided, localizes the heatmap specifically to the bounding box region.
    
    Args:
        original_image (np.ndarray): Original BGR image.
        heatmap (np.ndarray): 2D heatmap [0, 1].
        bbox (list): Bounding box of the face [x, y, w, h].
        alpha (float): Transparency multiplier for the heatmap overlay.
        
    Returns:
        np.ndarray: Combined BGR overlay image.
    """
    img_h, img_w = original_image.shape[:2]
    
    # 1. Resize heatmap to match the region of interest
    if bbox is not None:
        x, y, w, h = bbox
        # Safeguard coordinates
        x_start = max(0, x)
        y_start = max(0, y)
        x_end = min(img_w, x + w)
        y_end = min(img_h, y + h)
        
        region_w = x_end - x_start
        region_h = y_end - y_start
        
        if region_w <= 0 or region_h <= 0:
            # Fallback to full image
            bbox = None
            
    if bbox is None:
        # Overlay heatmap on the entire image
        resized_heatmap = cv2.resize(heatmap, (img_w, img_h))
        # Convert heatmap to uint8 [0, 255]
        heatmap_uint8 = np.uint8(255 * resized_heatmap)
        # Apply colormap (Jet colormap has red for high values, blue for low)
        color_heatmap = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
        
        # Superimpose the heatmap onto original image
        overlay = cv2.addWeighted(original_image, 1 - alpha, color_heatmap, alpha, 0)
    else:
        # Crop region, overlay, and paste back
        x_start, y_start, x_end, y_end = max(0, x), max(0, y), min(img_w, x + w), min(img_h, y + h)
        cropped_region = original_image[y_start:y_end, x_start:x_end]
        
        # Resize heatmap to match face crop dimensions
        resized_heatmap = cv2.resize(heatmap, (cropped_region.shape[1], cropped_region.shape[0]))
        heatmap_uint8 = np.uint8(255 * resized_heatmap)
        color_heatmap = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
        
        # Superimpose
        overlay_region = cv2.addWeighted(cropped_region, 1 - alpha, color_heatmap, alpha, 0)
        
        # Copy original image to avoid mutation
        overlay = original_image.copy()
        # Paste superimposed face region back into main image
        overlay[y_start:y_end, x_start:x_end] = overlay_region
        
        # Draw a sleek cyber-styled bounding box around the face
        # Bright neon cyan/red depending on deepfake suspicion (we'll draw default cyan here)
        cv2.rectangle(overlay, (x_start, y_start), (x_end, y_end), (255, 255, 0), 2)
        cv2.putText(overlay, "Analyzed Face Region", (x_start, max(15, y_start - 8)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1, cv2.LINE_AA)
                    
    return overlay

def generate_and_save_heatmap(image_path: str, model: tf.keras.Model, 
                              model_type: str = 'xception', output_path: str = None) -> str:
    """
    High-level function to run face detection, calculate Grad-CAM, create forensic overlay,
    and save the output heatmap image.
    
    Args:
        image_path (str): Path to input image file.
        model (tf.keras.Model): Model instance.
        model_type (str): 'xception' or 'mobilenetv2'.
        output_path (str): Destination file path. If None, saves in output dir with prefix.
        
    Returns:
        str: Absolute or relative path to the saved heatmap image.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Input image not found: {image_path}")
        
    # Read image
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not load image: {image_path}")
        
    # Find face(s)
    faces = detect_faces(img)
    
    if len(faces) == 0:
        # Fallback: full image Grad-CAM
        h, w = img.shape[:2]
        crop_size = min(h, w)
        x_start = (w - crop_size) // 2
        y_start = (h - crop_size) // 2
        bbox = [x_start, y_start, crop_size, crop_size]
        cropped = img[y_start:y_start+crop_size, x_start:x_start+crop_size]
    else:
        # Take the largest face
        faces = sorted(faces, key=lambda b: b[2] * b[3], reverse=True)
        bbox = faces[0]
        cropped = crop_face(img, bbox)
        
    # Preprocess face for model
    tensor = preprocess_face(cropped, target_size=(224, 224), model_type=model_type)
    
    # Generate Grad-CAM heatmaps
    heatmap_grid = generate_gradcam(model, tensor)
    
    # Generate Overlay
    overlay_img = create_forensic_overlay(img, heatmap_grid, bbox=bbox, alpha=0.45)
    
    # Save output
    if output_path is None:
        filename = f"gradcam_{os.path.basename(image_path)}"
        output_path = os.path.join(settings.OUTPUT_DIR, filename)
        
    cv2.imwrite(output_path, overlay_img)
    logger.info(f"Forensic overlay saved successfully to {output_path}")
    
    return output_path

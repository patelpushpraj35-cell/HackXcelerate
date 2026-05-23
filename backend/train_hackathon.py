import os
import shutil
import random
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns

# Add backend directory to path so we can import our modules
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.ai.train import build_xception_model
from app.ai.predict import predict_image
from app.ai.heatmap import generate_and_save_heatmap

def verify_and_copy_subset(src_dir, dest_dir, limit=200):
    """
    Scans src_dir for valid images, verifies their integrity with PIL, 
    and copies 'limit' number of images to dest_dir.
    """
    os.makedirs(dest_dir, exist_ok=True)
    all_files = [f for f in os.listdir(src_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    random.seed(42)
    random.shuffle(all_files)
    
    copied = 0
    checked = 0
    
    for filename in all_files:
        if copied >= limit:
            break
            
        src_path = os.path.join(src_dir, filename)
        dest_path = os.path.join(dest_dir, filename)
        
        # Verify integrity
        try:
            with Image.open(src_path) as img:
                img.verify()
            # If valid, copy
            shutil.copy2(src_path, dest_path)
            copied += 1
        except Exception:
            # Skip corrupted files
            pass
            
        checked += 1
        
    print(f"Checked {checked} files. Copied {copied} verified files to {dest_dir}.")
    return copied

def main():
    print("====================================================")
    print("TruthLens AI - Deepfake Model Training & Verification")
    print("====================================================")
    
    # 1. Dataset Setup & Subsampling
    # Target sizes: 300 images per class for training, 75 images per class for validation
    train_limit = 300
    val_limit = 75
    
    source_dataset_dir = "Dataset"
    split_dir = "dataset_split"
    
    print("\n--- Step 1: Subsampling & Verifying Dataset Integrity ---")
    # Training sub-sampling
    train_real_count = verify_and_copy_subset(
        os.path.join(source_dataset_dir, "Train", "Real"),
        os.path.join(split_dir, "train", "real"),
        limit=train_limit
    )
    train_fake_count = verify_and_copy_subset(
        os.path.join(source_dataset_dir, "Train", "Fake"),
        os.path.join(split_dir, "train", "fake"),
        limit=train_limit
    )
    
    # Validation sub-sampling
    val_real_count = verify_and_copy_subset(
        os.path.join(source_dataset_dir, "Validation", "Real"),
        os.path.join(split_dir, "validation", "real"),
        limit=val_limit
    )
    val_fake_count = verify_and_copy_subset(
        os.path.join(source_dataset_dir, "Validation", "Fake"),
        os.path.join(split_dir, "validation", "fake"),
        limit=val_limit
    )
    
    # Check balance
    print(f"Training Class distribution - Real: {train_real_count}, Fake: {train_fake_count}")
    print(f"Validation Class distribution - Real: {val_real_count}, Fake: {val_fake_count}")
    
    # 2. Data Generators Configuration
    print("\n--- Step 2: Preparing Preprocessing Generators ---")
    def preprocess_fn(img):
        # Pixel scaling to [-1, 1] as expected by XceptionNet
        return (img / 127.5) - 1.0

    train_datagen = ImageDataGenerator(
        preprocessing_function=preprocess_fn,
        rotation_range=15,
        width_shift_range=0.1,
        height_shift_range=0.1,
        shear_range=0.1,
        zoom_range=0.1,
        horizontal_flip=True,
        fill_mode='nearest'
    )
    
    val_datagen = ImageDataGenerator(
        preprocessing_function=preprocess_fn
    )
    
    train_generator = train_datagen.flow_from_directory(
        os.path.join(split_dir, "train"),
        target_size=(224, 224),
        batch_size=16,
        class_mode='binary',
        shuffle=True,
        seed=42
    )
    
    validation_generator = val_datagen.flow_from_directory(
        os.path.join(split_dir, "validation"),
        target_size=(224, 224),
        batch_size=16,
        class_mode='binary',
        shuffle=False,
        seed=42
    )
    
    # 3. Model Building & Compilation
    print("\n--- Step 3: Compiling XceptionNet Model Architecture ---")
    model = build_xception_model(input_shape=(224, 224, 3))
    
    # Ensure app/models directory exists
    os.makedirs("app/models", exist_ok=True)
    os.makedirs("app/outputs", exist_ok=True)
    
    # Save locations
    checkpoint_path = "app/models/xception_model.h5"
    checkpoint_detector_path = "app/models/xception_deepfake_detector.h5"
    
    # Callbacks
    checkpoint = ModelCheckpoint(
        checkpoint_path,
        monitor='val_loss',
        save_best_only=True,
        mode='min',
        verbose=1
    )
    
    early_stopping = EarlyStopping(
        monitor='val_loss',
        patience=3,
        restore_best_weights=True,
        verbose=1
    )
    
    # 4. Training
    print("\n--- Step 4: Starting Model Training ---")
    history = model.fit(
        train_generator,
        epochs=5,
        validation_data=validation_generator,
        callbacks=[checkpoint, early_stopping],
        verbose=1
    )
    
    # Make a copy of the best model to the default detector path for API compatibility
    if os.path.exists(checkpoint_path):
        shutil.copy2(checkpoint_path, checkpoint_detector_path)
        print(f"Copied trained weights to default API path: {checkpoint_detector_path}")
        
    # 5. Save Plots & Evaluation Metrics
    print("\n--- Step 5: Generating Evaluation Metrics & Plots ---")
    
    # Accuracy curves
    plt.figure(figsize=(10, 4))
    plt.subplot(1, 2, 1)
    plt.plot(history.history['accuracy'], label='Training Accuracy', color='#00aaff', linewidth=2)
    plt.plot(history.history['val_accuracy'], label='Validation Accuracy', color='#ffaa00', linewidth=2)
    plt.title('Training & Validation Accuracy')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.legend()
    plt.grid(True, linestyle='--', alpha=0.5)
    
    # Loss curves
    plt.subplot(1, 2, 2)
    plt.plot(history.history['loss'], label='Training Loss', color='#00aaff', linewidth=2)
    plt.plot(history.history['val_loss'], label='Validation Loss', color='#ffaa00', linewidth=2)
    plt.title('Training & Validation Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()
    plt.grid(True, linestyle='--', alpha=0.5)
    
    plt.tight_layout()
    plot_path = "app/outputs/training_curves.png"
    plt.savefig(plot_path, dpi=300)
    plt.close()
    print(f"Saved accuracy/loss learning curves to: {plot_path}")
    
    # Evaluate Confusion Matrix and Classification Report
    validation_generator.reset()
    y_true = validation_generator.classes
    y_pred_probs = model.predict(validation_generator)
    y_pred = (y_pred_probs > 0.5).astype(int).flatten()
    
    # Classification Report
    report = classification_report(y_true, y_pred, target_names=["Real", "Fake"])
    report_path = "app/outputs/classification_report.txt"
    with open(report_path, "w") as f:
        f.write(report)
    print(f"Saved classification report to: {report_path}")
    print("\nClassification Report:")
    print(report)
    
    # Confusion Matrix
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(5, 4))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=["Real", "Fake"], yticklabels=["Real", "Fake"])
    plt.title('Confusion Matrix')
    plt.ylabel('True Class')
    plt.xlabel('Predicted Class')
    cm_path = "app/outputs/confusion_matrix.png"
    plt.savefig(cm_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Saved confusion matrix image to: {cm_path}")
    
    # 6. Verification of Inference and Grad-CAM
    print("\n--- Step 6: Verifying Inference & Grad-CAM visualizer ---")
    # Take a test image
    test_dir = os.path.join(source_dataset_dir, "Test", "Fake")
    test_files = [f for f in os.listdir(test_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    
    if test_files:
        test_img_path = os.path.join(test_dir, test_files[0])
        print(f"Running test prediction on: {test_img_path}")
        
        # Test image prediction
        pred_res = predict_image(test_img_path, model, model_type="xception")
        print(f"Prediction Result: {pred_res['classification']} | Reality Score: {pred_res['reality_score']}% | Confidence: {pred_res['confidence']}")
        
        # Test Grad-CAM overlay
        heatmap_out_path = "app/outputs/test_gradcam.jpg"
        generate_and_save_heatmap(test_img_path, model, model_type="xception", output_path=heatmap_out_path)
        print(f"Saved forensic Grad-CAM overlay to: {heatmap_out_path}")
    else:
        print("No test files found to verify inference.")
        
    print("\n====================================================")
    print("TRAINING PROCESS COMPLETED!")
    print(f"Final Training Accuracy: {history.history['accuracy'][-1]:.4f}")
    print(f"Final Validation Accuracy: {history.history['val_accuracy'][-1]:.4f}")
    print(f"Model Save Location: {checkpoint_path}")
    print("To start the backend, run: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload")
    print("====================================================")

if __name__ == "__main__":
    main()

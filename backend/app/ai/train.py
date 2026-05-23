import os
import matplotlib.pyplot as plt
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import Xception, MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout, Input
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns
import logging

# Configure logger
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def build_xception_model(input_shape=(299, 299, 3)) -> Model:
    """
    Builds the Xception model for transfer learning.
    
    Args:
        input_shape (tuple): Dimensions of input image (height, width, channels).
        
    Returns:
        Model: Compiled Keras model.
    """
    logger.info("Building Xception Transfer Learning Model...")
    
    # Input Layer
    inputs = Input(shape=input_shape)
    
    # Base Xception pre-trained on ImageNet
    base_model = Xception(weights='imagenet', include_top=False, input_tensor=inputs)
    
    # Freeze base model layers to preserve pre-trained features
    base_model.trainable = False
    
    # Custom Classification Head
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(256, activation='relu')(x)
    x = Dropout(0.5)(x)
    
    # Binary classification (REAL = 0, FAKE = 1)
    outputs = Dense(1, activation='sigmoid')(x)
    
    model = Model(inputs=inputs, outputs=outputs, name="TruthLens_Xception")
    
    # Compile model
    model.compile(
        optimizer=Adam(learning_rate=1e-4),
        loss='binary_crossentropy',
        metrics=['accuracy']
    )
    
    logger.info(f"Xception model summary:\n{model.summary()}")
    return model

def build_mobilenetv2_model(input_shape=(224, 224, 3)) -> Model:
    """
    Builds the MobileNetV2 model for lightweight transfer learning.
    
    Args:
        input_shape (tuple): Dimensions of input image.
        
    Returns:
        Model: Compiled Keras model.
    """
    logger.info("Building MobileNetV2 Lightweight Fallback Model...")
    
    # Input Layer
    inputs = Input(shape=input_shape)
    
    # Base MobileNetV2 pre-trained on ImageNet
    base_model = MobileNetV2(weights='imagenet', include_top=False, input_tensor=inputs)
    
    # Freeze base model layers
    base_model.trainable = False
    
    # Custom Classification Head
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(128, activation='relu')(x)
    x = Dropout(0.4)(x)
    
    # Binary classification
    outputs = Dense(1, activation='sigmoid')(x)
    
    model = Model(inputs=inputs, outputs=outputs, name="TruthLens_MobileNetV2")
    
    model.compile(
        optimizer=Adam(learning_rate=1e-4),
        loss='binary_crossentropy',
        metrics=['accuracy']
    )
    
    logger.info(f"MobileNetV2 model summary:\n{model.summary()}")
    return model

def get_data_generators(dataset_dir: str, target_size=(299, 299), batch_size=32, validation_split=0.2):
    """
    Creates training and validation data generators with data augmentation.
    
    Args:
        dataset_dir (str): Directory where 'real' and 'fake' subfolders are located.
        target_size (tuple): Image size for resizing.
        batch_size (int): Size of batches.
        validation_split (float): Fraction of images to reserve for validation.
        
    Returns:
        tuple: (train_generator, validation_generator)
    """
    # Custom preprocessing to match the [-1, 1] scaling during inference: (x / 127.5) - 1.0
    def preprocess_fn(img):
        return (img / 127.5) - 1.0

    # Augmentation for training, simple scaling for validation
    train_datagen = ImageDataGenerator(
        preprocessing_function=preprocess_fn,
        rotation_range=20,
        width_shift_range=0.15,
        height_shift_range=0.15,
        shear_range=0.15,
        zoom_range=0.15,
        horizontal_flip=True,
        fill_mode='nearest',
        validation_split=validation_split
    )

    # Note validation generator uses the same preprocessing function
    validation_datagen = ImageDataGenerator(
        preprocessing_function=preprocess_fn,
        validation_split=validation_split
    )

    # Train flow
    train_generator = train_datagen.flow_from_directory(
        dataset_dir,
        target_size=target_size,
        batch_size=batch_size,
        classes=['real', 'fake'],
        class_mode='binary',
        subset='training',
        shuffle=True,
        seed=42
    )

    # Validation flow
    validation_generator = validation_datagen.flow_from_directory(
        dataset_dir,
        target_size=target_size,
        batch_size=batch_size,
        classes=['real', 'fake'],
        class_mode='binary',
        subset='validation',
        shuffle=False,
        seed=42
    )

    logger.info(f"Created generators. Classes found: {train_generator.class_indices}")
    return train_generator, validation_generator

def train_model(dataset_dir: str, model_type: str = 'xception', epochs: int = 15, 
                batch_size: int = 32, validation_split: float = 0.2, output_dir: str = 'app/outputs'):
    """
    Main model training loop. Sets up generators, architecture, callbacks, and trains the model.
    
    Args:
        dataset_dir (str): Directory containing the dataset.
        model_type (str): 'xception' or 'mobilenetv2'.
        epochs (int): Number of training epochs.
        batch_size (int): Batch size.
        validation_split (float): Split fraction for validation.
        output_dir (str): Location to save metrics and visual outputs.
    """
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Setup Data Generators
    train_gen, val_gen = get_data_generators(
        dataset_dir, 
        batch_size=batch_size, 
        validation_split=validation_split
    )
    
    # 2. Select Architecture
    if model_type.lower() == 'xception':
        model = build_xception_model()
        model_filename = "xception_deepfake_detector.h5"
    elif model_type.lower() == 'mobilenetv2':
        model = build_mobilenetv2_model()
        model_filename = "mobilenetv2_deepfake_detector.h5"
    else:
        raise ValueError(f"Unknown model type: {model_type}. Select 'xception' or 'mobilenetv2'.")

    # 3. Setup callbacks
    model_save_path = os.path.join('app/models', model_filename)
    os.makedirs('app/models', exist_ok=True)
    
    checkpoint = ModelCheckpoint(
        model_save_path,
        monitor='val_loss',
        save_best_only=True,
        mode='min',
        verbose=1
    )
    
    early_stopping = EarlyStopping(
        monitor='val_loss',
        patience=5,
        restore_best_weights=True,
        verbose=1
    )
    
    # 4. Train
    logger.info(f"Starting training for {model_type} model...")
    history = model.fit(
        train_gen,
        epochs=epochs,
        validation_data=val_gen,
        callbacks=[checkpoint, early_stopping],
        verbose=1
    )
    
    logger.info(f"Model saved successfully to {model_save_path}")
    
    # 5. Evaluate and save reports
    evaluate_and_plot(model, val_gen, output_dir)
    
    return history

def evaluate_and_plot(model: Model, validation_generator, output_dir: str):
    """
    Evaluates the model on validation data, generates classification report, 
    confusion matrix, and saves results.
    
    Args:
        model (Model): Trained Keras model.
        validation_generator: Keras validation generator (should NOT be shuffled).
        output_dir (str): Folder to save files.
    """
    logger.info("Evaluating model on validation dataset...")
    
    # Reset generator to start from the beginning
    validation_generator.reset()
    
    # Get ground truth labels
    y_true = validation_generator.classes
    
    # Run predictions
    y_pred_probs = model.predict(validation_generator)
    y_pred = (y_pred_probs > 0.5).astype(int).flatten()
    
    # Generate classification report
    class_names = list(validation_generator.class_indices.keys())
    report = classification_report(y_true, y_pred, target_names=class_names)
    
    report_path = os.path.join(output_dir, "classification_report.txt")
    with open(report_path, "w") as f:
        f.write(report)
    logger.info(f"Classification report saved to {report_path}")
    
    # Generate confusion matrix
    cm = confusion_matrix(y_true, y_pred)
    
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=class_names, yticklabels=class_names)
    plt.title('Confusion Matrix - Deepfake Detector')
    plt.ylabel('True Class')
    plt.xlabel('Predicted Class')
    
    cm_path = os.path.join(output_dir, "confusion_matrix.png")
    plt.savefig(cm_path, dpi=300, bbox_inches='tight')
    plt.close()
    logger.info(f"Confusion Matrix heatmap saved to {cm_path}")

from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
import pickle
import os
import numpy as np
from PIL import Image
import io
import torchvision.transforms as transforms
import torch
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost.tiangolo.com",
    "https://localhost.tiangolo.com",
    "http://localhost",
    "http://localhost:8000",
]
treatment_data = pd.read_excel("Medication.xlsx", engine="openpyxl")
treatment_dict = treatment_data.set_index("Disease").to_dict("index")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the fish prediction model
with open("models/clf.pkl", "rb") as f:
    fish_model = pickle.load(f)

# Load the disease prediction model
with open("models/disease_clf.pkl", "rb") as f:
    disease_model = pickle.load(f)

# Dictionary to map disease labels to disease names
disease_names = {
    0: "Argulus",
    1: "Broken antennae and rostrum",
    2: "EUS",
    3: "Local Fish",
    4: "Red Spot",
    5: "Tail And Fin Rot",
    6: "The Bacterial Gill Rot",
}


class PredictionInput(BaseModel):
    ammonia: float
    nitrite: float
    nitrate: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float


class PredictionResponse(BaseModel):
    fish: str
    image: str


class DiseasePredictionResponse(BaseModel):
    disease: str
    probability: float


class TreatmentResponse(BaseModel):
    disease: str
    treatment: str
    medication: str


def find_image_path(base_path, filename):
    """Helper function to find the correct file extension if multiple exist."""
    for extension in ["jpg", "jpeg", "png"]:
        full_path = f"{base_path}/{filename}.{extension}"
        if os.path.exists(full_path):
            return full_path
    return None


def predict_image(image_bytes, model, threshold=0.4):
    try:
        # Load the image
        image = Image.open(io.BytesIO(image_bytes))

        # Convert image to RGB if it's not (to handle RGBA or other formats)
        if image.mode != "RGB":
            image = image.convert("RGB")

        # Define preprocessing steps
        preprocess = transforms.Compose(
            [
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ]
        )

        # Apply preprocessing to the image
        image_tensor = preprocess(image).unsqueeze(0)  # Add batch dimension

        # Ensure the model and data are on the same device
        device = next(model.parameters()).device
        image_tensor = image_tensor.to(device)

        # Perform prediction
        with torch.no_grad():
            output = model(image_tensor)

        # Calculate probabilities and determine the predicted class
        probabilities = torch.softmax(output, dim=1)
        max_probability, predicted_class = torch.max(probabilities, dim=1)

        if max_probability.item() > threshold:
            return (
                disease_names.get(predicted_class.item(), "Unknown Disease"),
                max_probability.item(),
            )
        else:
            return "No significant disease detected", max_probability.item()
    except Exception as e:
        print(f"Error during image prediction: {e}")
        raise HTTPException(status_code=500, detail="Error processing the image")


@app.post("/predict-fish", response_model=PredictionResponse)
async def predict_fish(input_data: PredictionInput):
    try:
        features = [
            input_data.ammonia,
            input_data.nitrite,
            input_data.nitrate,
            input_data.temperature,
            input_data.humidity,
            input_data.ph,
            input_data.rainfall,
        ]
        prediction = fish_model.predict(np.array([features]))[0]
        base_path = "Fish images"
        filename = prediction.lower()
        image_path = find_image_path(base_path, filename)

        if not image_path:
            raise HTTPException(status_code=404, detail="Image file not found")

        return PredictionResponse(fish=prediction, image=image_path)
    except Exception as e:
        print("Error during fish prediction:", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict-disease", response_model=DiseasePredictionResponse)
async def predict_disease(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        disease, probability = predict_image(image_bytes, disease_model)
        return DiseasePredictionResponse(disease=disease, probability=probability)
    except Exception as e:
        print("Error during disease prediction:", e)
        raise HTTPException(status_code=500, detail="Error predicting disease")


@app.get("/img")
async def get_image(path: str):
    return FileResponse(path)


@app.get("/predict-treatment/{disease}", response_model=TreatmentResponse)
async def predict_treatment(disease: str):
    if disease in treatment_dict:
        treatment_info = treatment_dict[disease]
        return TreatmentResponse(
            disease=disease,
            treatment=treatment_info["Treatment"],
            medication=treatment_info["Medication"],
        )
    else:
        raise HTTPException(
            status_code=404, detail="No treatment information found for the specified disease"
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

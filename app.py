from flask import Flask, render_template, request
import pickle
import numpy as np

app = Flask(__name__)

# Load the model
with open('models/clf.pkl', 'rb') as f:
    model = pickle.load(f)

@app.route('/', methods=['GET'])
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    # Get the data from the POST request.
    data = request.form

    # Convert the form data to floats
    ammonia = float(data['Ammonia'])
    nitrite = float(data['Nitrite'])
    nitrate = float(data['Nitrate'])
    temperature = float(data['temperature'])
    humidity = float(data['humidity'])
    ph = float(data['ph'])
    rainfall = float(data['rainfall'])

    # Make a prediction using the model loaded from disk as per the data.
    prediction = model.predict(np.array([[ammonia, nitrite, nitrate, temperature, humidity, ph, rainfall]]))

    # Take the first value of prediction
    output = prediction[0]

    return render_template('index.html', prediction_text='Predicted Fish: {}'.format(output))


if __name__ == "__main__":
    app.run(debug=True)
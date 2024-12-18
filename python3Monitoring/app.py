import streamlit as st
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

# Título de la aplicación
st.title("Hola Mundo - Real-Time Machine Learning")

# Crear un DataFrame vacío para almacenar los datos
data = pd.DataFrame(columns=["X", "Y"])

# Entrada del usuario
x_input = st.number_input("Ingrese el valor de X:", value=0.0)
y_input = st.number_input("Ingrese el valor de Y:", value=0.0)

# Botón para agregar datos
if st.button("Agregar Datos"):
    # Agregar los nuevos datos al DataFrame
    new_data = pd.DataFrame({"X": [x_input], "Y": [y_input]})
    data = pd.concat([data, new_data], ignore_index=True)
    st.success("Datos agregados!")

# Mostrar los datos acumulados
st.subheader("Datos acumulados:")
st.write(data)

# Verificar si hay suficientes datos para entrenar el modelo
if len(data) > 1:
    # Entrenar el modelo de regresión lineal
    model = LinearRegression()
    model.fit(data[["X"]], data["Y"])

    # Realizar una predicción
    x_pred = st.number_input("Ingrese un valor de X para hacer una predicción:", value=0.0)
    y_pred = model.predict(np.array([[x_pred]]))

    # Mostrar la predicción
    st.subheader(f"La predicción para X = {x_pred} es Y = {y_pred[0]:.2f}")
else:
    st.warning("Agregue más datos para entrenar el modelo.")


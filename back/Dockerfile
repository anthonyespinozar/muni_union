FROM node:20-slim

# Instalar dependencias necesarias para compilación de algunos módulos si es necesario
# RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm install --production

# Copiar el resto del código
COPY . .

# Crear carpeta de uploads si no existe
RUN mkdir -p uploads/documentos

# Exponer el puerto configurado
EXPOSE 4000

# Comando para iniciar
CMD ["npm", "start"]

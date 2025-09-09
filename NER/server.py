# dbms lab project - kyc documents
# This is a stateless custom API that is made to handle the extraction of data from uploaded PDF documents using Llama 3.1 model.

from flask import Flask, jsonify, request
import os
from dotenv import load_dotenv
from flask_cors import CORS
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from io import BytesIO
from LlamaFinal import process_pdf_with_llama

app = Flask(__name__)
CORS(app)
load_dotenv()

# Google Cloud Console service account setup
SCOPES = ['https://www.googleapis.com/auth/drive.file']
SERVICE_ACCOUNT_FILE = os.getenv('SERVICE_ACCOUNT_FILE')

credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES)

drive_service = build('drive', 'v3', credentials=credentials)

@app.route('/', methods=['GET'])
def test():
    return jsonify({"message": "Flask server is running"}), 200

@app.route('/uploadDetails', methods=['POST'])
def upload_details():
    try:
        # file uploads
        files = request.files
        if not files:
            return jsonify({"error": "No files uploaded."}), 400

        file_drive_links = {}
        document_outputs = []

        for file_key, file in files.items():
            # file content in memory usage
            file_stream = BytesIO(file.read())

            document_data = process_pdf_with_llama(file_stream)

            if not document_data:
                return jsonify({"error": "Failed to process the document."}), 500

            document_outputs.append(document_data)
            print(document_data)

            file_metadata = {'name': file.filename}
            file_stream.seek(0)
            media = MediaIoBaseUpload(file_stream, mimetype=file.mimetype, resumable=True)

            file_response = drive_service.files().create(
                body=file_metadata, media_body=media, fields='id').execute()

            if file_response:
                drive_file_id = file_response.get('id')

                drive_service.permissions().create(
                    fileId=drive_file_id,
                    body={
                        "type": "anyone",
                        "role": "reader"
                    }
                ).execute()

                drive_file_link = f"https://drive.google.com/file/d/{drive_file_id}/view"
                file_drive_links[file_key] = drive_file_link

        extracted_entries = []
        for doc_data in document_outputs:
            if isinstance(doc_data, list):
                extracted_entries.extend(doc_data)
            else:
                extracted_entries.append(doc_data)

        if not extracted_entries:
            return jsonify({"error": "No data extracted from uploaded documents."}), 500

        return jsonify({
            "extracted_data": extracted_entries,
            "uploaded_files": file_drive_links
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)

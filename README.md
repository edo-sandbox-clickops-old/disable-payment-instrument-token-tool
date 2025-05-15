# Membership Payment Instrument Token Manager

## Overview

The Membership Payment Instrument Token Manager is a Next.js web application designed to help internal teams disable member payment instrument tokens by interacting with various internal microservices. It provides a user-friendly interface for processing individual members or handling batch operations via CSV uploads. The application also includes an AI-powered chat interface to query processing results and uploaded data.

This tool streamlines the process of:
* Identifying memberships's recurring collections based on email, prime status, and brand.
* Extracting payment instrument token relationships.
* Calling internal APIs to disable these tokens.
* Providing detailed feedback and logs for each operation.

## Features

* **Single Member Processing:** Input fields for Email, Prime Status, and Brand to process individual members.
* **Batch CSV Upload:** Process multiple members by uploading a CSV file.
    * Supports dynamic columns from the uploaded CSV in the results.
    * Clear indication of required CSV columns.
* **Interaction with Internal Microservices:** (Conceptual - requires actual API integration)
    * Fetches membership data from a `memberships-api`.
    * Retrieves recurring collection details from a `recurringCollection-api`.
    * Calls a disable endpoint on the `recurringCollection-api`.
* **Detailed Logging:** Real-time logs display the status of each processing step.
* **Results Table & Download:**
    * Displays all original columns from the uploaded CSV along with new task status columns ("Task Status", "Task Message").
    * Allows downloading the augmented results as a new CSV file.
    * Pagination for results if more than 10 items are processed.
* **AI Chat Interface:**
    * Powered by Google Vertex AI Gemini API.
    * Allows users to ask questions about the processing logs and the content of the uploaded CSV file.
    * Features conversation memory and streaming responses for an interactive experience.
* **Modern UI:** Styled with Tailwind CSS for a clean, Copilot-like user interface.
* **Footer:** Displays a "Made with ❤️ by Paycomms team" message with the Paycomms logo.

## Prerequisites

Before you begin, ensure you have the following installed and configured:

* **Node.js:** Version 18.x or later.
* **Package Manager:** npm, yarn, or pnpm.
* **Google Cloud Project:**
    * A Google Cloud Project ID.
    * Vertex AI API enabled within the project.
    * [Application Default Credentials (ADC)](https://cloud.google.com/docs/authentication/provide-credentials-adc) set up for local development (usually via `gcloud auth application-default login`). The account used for ADC must have permissions to use the Vertex AI API (e.g., "Vertex AI User" role).
    * A valid Google Cloud region where Vertex AI Gemini models are available.
* **Access to Internal Microservices:** The application is designed to call internal APIs. You will need network access to these services and any necessary authentication credentials/mechanisms for them.
* **Logo:** The Paycomms logo (`Paco_primary_circle_light.png`) should be placed in the `public/` directory of this project.

## Setup Instructions

### 1. Clone the Repository (if applicable)
If the project is in a Git repository, clone it to your local machine:

```bash
git clone <your-repository-url>
cd <repository-name>
```

### 2. Install Dependencies
Install the project dependencies using your preferred package manager:

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Variables
Create a .env.local file in the root of the project. This file will store your environment-specific configurations. Add the following variables, replacing the placeholder values with your actual configuration:

```Code snippet
# .env.local

# Google Cloud Vertex AI Configuration
GCLOUD_PROJECT=your-google-cloud-project-id
GCLOUD_LOCATION=your-gcp-region # e.g., us-central1, europe-west4
VERTEX_AI_GEMINI_MODEL_ID=gemini-1.5-flash-001 # Or your preferred Gemini model on Vertex AI
```

### 4. Install Dependencies
Install the project dependencies using your preferred package manager:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```
The application should now be accessible at http://localhost:3000 (or another port if 3000 is in use).


## How to Use the Application
--------------------------

### UI Overview

The application interface is divided into several main sections:

*   **Process Memberships:** Contains forms for single entry processing and batch CSV uploads.
    
*   **Processing Results:** (Appears after processing) A table displaying detailed outcomes for each processed item.
    
*   **Processing Log:** Shows detailed logs of the operations performed.
    
*   **AI Chat:** (Appears if there's data to query) An interface to ask questions about logs and CSV data.
    

### 1\. Single Entry Processing

1.  Navigate to the "Single Entry" form.
    
2.  Enter the member's **Email Address**.
    
3.  Select the member's current **Prime Status** from the dropdown (options: PENDING\_TO\_ACTIVATE, PENDING\_TO\_COLLECT, EXPIRED, DEACTIVATED, ACTIVATED, N/A).
    
4.  Select the **Brand** from the dropdown (options: ED, GV, OP, TL).
    
5.  Click the "Process Single Entry" button.
    
6.  Monitor the "Processing Log" and "Processing Results" table for feedback.
    

### 2\. Batch Processing via CSV Upload

1.  **Prepare your CSV File:**
    
    *   The file **must be in .csv format**. If you have an Excel file (.xlsx), open it in a spreadsheet program and use "Save As" or "Export" to convert it to CSV.
        
    *   **Required Columns (exact names):**
        
        *   VIP Comms: \\nCustomer's email (for the email address; note the newline character \\n)
            
        *   Prime status (for the prime status; note the trailing space)
            
        *   Brand (for the brand identifier)
            
    *   Any other columns in your CSV will be preserved and displayed in the results table and included in the downloaded results CSV.
        
    *   Ensure the CSV headers match these names precisely for the required columns.
        
2.  **Upload the File:**
    
    *   In the "Batch Upload (CSV)" section, click the file input area or "Choose File" button.
        
    *   Select your prepared .csv file. The selected filename will appear.
        
3.  **Process the File:**
    
    *   Click the "Process File" button.
        
4.  **Monitor Outputs:**
    
    *   Observe the "Processing Log" for detailed step-by-step information.
        
    *   The "Processing Results" table will populate with each row from your CSV, plus new columns: "Task Status" and "Task Message".
        

### 3\. Interpreting Results

*   **Processing Log:** This section provides verbose, real-time (or near real-time) feedback on the actions being taken, including API calls (placeholders in the current version), successes, and failures. Error messages will appear here.
    
*   **Processing Results Table:**
    
    *   This table shows all columns from your original CSV file.
        
    *   **Task Status:** A summary status for each processed item (e.g., "Tokens Disabled Successfully", "No Membership Found", "Processing Error"). The color of this status indicates success (green), warning/no action (amber), or error (red).
        
    *   **Task Message:** A more detailed message related to the Task Status.
        
    *   The table is paginated if there are more than 10 results.
        
*   **Downloading Results:** Click the "Download Results as CSV" button above the results table. This will download a new CSV file containing all your original data plus the "Task Status" and "Task Message" columns.
    

### 4\. Using the AI Chat

Once you have processed some data (either single entry or batch), the AI Chat interface will be available.

*   **Purpose:** Ask questions in natural language about the processing logs or the data contained in the CSV you uploaded (a sample of the CSV data is provided to the AI).
    
*   **Functionality:**
    
    *   **Conversation Memory:** The AI remembers previous parts of your current chat session.
        
    *   **Streaming Responses:** AI answers appear word by word for a more interactive feel.
        
*   **Example Questions:**
    
    *   "What was the status for test@example.com?"
        
    *   "Which entries had errors?"
        
    *   "Show me the 'Prime status ' for all entries with brand 'ED' from the CSV." (Note: AI sees a sample of CSV).
        
    *   "Summarize the logs."
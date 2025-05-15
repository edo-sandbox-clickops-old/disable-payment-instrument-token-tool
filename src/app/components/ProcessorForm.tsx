// app/components/ProcessorForm.tsx
'use client';

import Image from 'next/image';
import Papa from 'papaparse';
import React, { useState, startTransition, useRef, useEffect } from 'react';

import { processEmailsAction, type ProcessFormInput, type ProcessedItem } from '../actions/processEmails';
import ChatInterface from './ChatInterface';

const convertToCSV = (data: Record<string, any>[]) => {
  if (!data || data.length === 0) return "";
  return Papa.unparse(data);
};

const PrimeStatusOptions = [
  "PENDING_TO_ACTIVATE",
  "PENDING_TO_COLLECT",
  "EXPIRED",
  "DEACTIVATED",
  "ACTIVATED",
  "N/A"
];

const BrandOptions = ["ED", "GV", "OP", "TL"]; // Brand options

const ITEMS_PER_PAGE = 10; // For pagination

export default function ProcessorForm() {
  const [email, setEmail] = useState('');
  const [singlePrimeStatus, setSinglePrimeStatus] = useState<string>(PrimeStatusOptions[PrimeStatusOptions.length - 1]);
  const [singleBrand, setSingleBrand] = useState<string>(BrandOptions[0]); // Default to first brand
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [originalCsvData, setOriginalCsvData] = useState<Record<string, string>[]>([]);
  const [processedResults, setProcessedResults] = useState<ProcessedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tableHeaders, setTableHeaders] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const emailColumnKey = "VIP Comms: \nCustomer's email";
  const primeStatusColumnKey = "Prime status ";
  const brandColumnKey = "Brand";

  useEffect(() => {
    if (processedResults.length > 0) {
      let headers: string[] = [];
      if (processedResults[0]?.originalRowData && Object.keys(processedResults[0].originalRowData).length > 0) {
          headers = Object.keys(processedResults[0].originalRowData);
      } else if (originalCsvData.length > 0 && Object.keys(originalCsvData[0]).length > 0) {
          headers = Object.keys(originalCsvData[0]);
      } else if (processedResults.length > 0) {
          const sampleItem = processedResults[0];
          const tempHeaders = new Set<string>();
          if (sampleItem.originalRowData) { // Check if originalRowData exists
              Object.keys(sampleItem.originalRowData).forEach(h => tempHeaders.add(h));
          } else { // Fallback if no originalRowData (e.g. for minimal single entry)
              if (sampleItem.email) tempHeaders.add("Email (Processed)"); // Differentiate if needed
              if (sampleItem.primeStatus) tempHeaders.add("Prime Status (Processed)");
              if (sampleItem.brand) tempHeaders.add("Brand (Processed)");
          }
          headers = Array.from(tempHeaders);
      }
      const newColumns = ["Task Status", "Task Message"];
      // Ensure headers from original data are preserved, then add new ones
      // Remove any potential newColumns that might already exist in headers (e.g. if CSV had them)
      const uniqueNewColumns = newColumns.filter(nc => !headers.includes(nc));
      setTableHeaders([...headers, ...uniqueNewColumns]);
  } else {
      setTableHeaders([]);
  }
  setCurrentPage(1);
  }, [processedResults, originalCsvData]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setFileName(selectedFile.name);
        setLogs(prev => [`File selected: ${selectedFile.name}`, ...prev]);
        setProcessedResults([]);
        setOriginalCsvData([]);
      } else {
        setFile(null);
        setFileName('');
        if (fileInputRef.current) fileInputRef.current.value = "";
        setLogs(prev => [`Error: Invalid file type. Please upload a .csv file.`, ...prev]);
        alert("Invalid file type. Please save your Excel sheet as a CSV file and try again.");
      }
    }
  };

  const processSingleEntry = async () => {
    if (!email) {
      setLogs(prev => ['Error: Please enter an email address.', ...prev]);
      return;
    }
    setIsProcessing(true);
    const singleEntryOriginalData: Record<string, string> = {};
    singleEntryOriginalData[emailColumnKey] = email;
    singleEntryOriginalData[primeStatusColumnKey] = singlePrimeStatus;
    singleEntryOriginalData[brandColumnKey] = singleBrand;

    const inputData: ProcessFormInput[] = [{
      email,
      primeStatus: singlePrimeStatus,
      brand: singleBrand,
      originalRowData: singleEntryOriginalData
    }];

    setLogs(prev => [`Processing single entry: Email: ${email}, Prime Status: ${singlePrimeStatus}...`, ...prev]);
    setProcessedResults([]);
    setOriginalCsvData([singleEntryOriginalData]);

    startTransition(async () => {
      const { logs: newLogs, results: newResults } = await processEmailsAction(inputData);
      setLogs(prev => [...newLogs.reverse(), ...prev]);
      setProcessedResults(newResults);
      setIsProcessing(false);
    });
  };

  const processFileEntries = () => {
    if (!file) {
      setLogs(prev => ['Error: Please select a .csv file to process.', ...prev]);
      return;
    }
    setIsProcessing(true);
    setLogs(prev => [`Parsing CSV file: ${file.name}...`, ...prev]);
    setProcessedResults([]);
    setOriginalCsvData([]);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
            setLogs(prev => [`Error parsing CSV: ${results.errors.map(e => e.message).join(', ')}`, ...prev]);
            setIsProcessing(false); return;
        }
        if (!results.data || results.data.length === 0) {
            setLogs(prev => [`Error: CSV file seems empty or headers are missing.`, ...prev]);
            setIsProcessing(false); return;
        }
        setOriginalCsvData(results.data);
        if (results.meta && results.meta.fields) {
          const headers = results.meta.fields;
          let missingColumns = [];
          if (!headers.includes(emailColumnKey)) missingColumns.push(`"${emailColumnKey}"`);
          if (!headers.includes(primeStatusColumnKey)) missingColumns.push(`"${primeStatusColumnKey}"`);
          if (!headers.includes(brandColumnKey)) missingColumns.push(`"${brandColumnKey}"`); // Check for Brand column

          if (missingColumns.length > 0) {
               setLogs(prev => [`Error: Required column(s) ${missingColumns.join(', ')} not found in CSV. Found headers: ${headers.join(', ')}`, ...prev]);
               setIsProcessing(false); return;
          }
        }

        const dataToProcess: ProcessFormInput[] = results.data
          .map(row => ({
            email: row[emailColumnKey]?.trim(),
            primeStatus: row[primeStatusColumnKey]?.trim() || 'N/A',
            brand: row[brandColumnKey]?.trim() || BrandOptions[0],
            originalRowData: row
          }))
          .filter(item => item.email);
        if (dataToProcess.length === 0) {
          setLogs(prev => [`Error: No valid entries with email addresses found in the file.`, ...prev]);
          setIsProcessing(false); return;
        }
        setLogs(prev => [`Successfully parsed ${dataToProcess.length} entr(y/ies) from ${file.name}. Starting processing...`, ...prev]);
        startTransition(async () => {
          const { logs: newLogs, results: newResults } = await processEmailsAction(dataToProcess);
          setLogs(prev => [...newLogs.reverse(), ...prev]);
          setProcessedResults(newResults);
          setIsProcessing(false);
        });
      },
      error: (error: Error) => {
        setLogs(prev => [`Error parsing CSV file: ${error.message}`, ...prev]);
        setIsProcessing(false);
      }
    });
  };

  const handleDownloadCsv = () => {
    if (processedResults.length === 0) {
      alert("No processed data to download.");
      return;
    }
    const dataToDownload = processedResults.map((item) => {
      const baseData = { ...(item.originalRowData || {}) };
      baseData["Task Status"] = item.taskStatus;
      baseData["Task Message"] = item.processedMessage;
      return baseData;
    });
    const csv = convertToCSV(dataToDownload);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `processed_feedback_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setLogs(prev => ["Successfully prepared CSV for download.", ...prev]);
  };

  const totalPages = Math.ceil(processedResults.length / ITEMS_PER_PAGE);
  const paginatedResults = processedResults.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const cardClasses = "bg-white shadow-xl rounded-lg p-6 space-y-6";
  const inputBaseClasses = "block w-full text-sm rounded-md shadow-sm disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed";
  const commonInputPadding = "px-3 py-2.5";
  const textInputClasses = `${inputBaseClasses} ${commonInputPadding} border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500`;
  const selectInputClasses = `${inputBaseClasses} ${commonInputPadding} border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500`;
  const fileInputClasses = `${inputBaseClasses} file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 text-slate-500`;
  const buttonBaseClasses = "text-sm font-medium rounded-md shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150";
  const buttonPrimaryClasses = `${buttonBaseClasses} px-4 py-2.5 bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-blue-600`;
  const buttonSecondaryClasses = `${buttonBaseClasses} px-4 py-2.5 bg-slate-200 text-slate-700 hover:bg-slate-300 focus-visible:outline-slate-400`;
  const paginationButtonClasses = `${buttonBaseClasses} px-3 py-1.5 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus-visible:outline-blue-500`;
  const headingClasses = "text-xl font-semibold text-slate-900";
  const labelClasses = "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 flex flex-col">
      <main className="flex-grow max-w-6xl mx-auto space-y-8 w-full">
        <header className="text-center my-8">
          <h1 className="text-4xl font-bold text-blue-700">
            Membership Payment Instrument Manager
          </h1>
        </header>

        <section className={cardClasses}>
          <h2 className={headingClasses}>Process Memberships</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Single Entry */}
            <div className="flex flex-col space-y-4">
              <h3 className="text-lg font-medium text-slate-800">Single Entry</h3>
              <div>
                <label htmlFor="single-email" className={labelClasses}>Email Address</label>
                <input id="single-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isProcessing} className={textInputClasses} placeholder="member@example.com" />
              </div>
              <div>
                <label htmlFor="single-prime-status" className={labelClasses}>Prime Status</label>
                <select id="single-prime-status" value={singlePrimeStatus} onChange={(e) => setSinglePrimeStatus(e.target.value)} disabled={isProcessing} className={selectInputClasses}>
                  {PrimeStatusOptions.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
              <div> {/* New Brand Select Field */}
                <label htmlFor="single-brand" className={labelClasses}>Brand</label>
                <select id="single-brand" value={singleBrand} onChange={(e) => setSingleBrand(e.target.value)} disabled={isProcessing} className={selectInputClasses}>
                  {BrandOptions.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                </select>
              </div>
              <button onClick={processSingleEntry} disabled={isProcessing || !email} className={`${buttonPrimaryClasses} w-full mt-auto`}>
                {isProcessing ? 'Processing...' : 'Process Single Entry'}
              </button>
            </div>

            {/* File Upload */}
            <div className="flex flex-col space-y-4">
              <h3 className="text-lg font-medium text-slate-800">Batch Upload (CSV)</h3>
              <div>
                <label htmlFor="file-upload" className={labelClasses}>CSV File</label>
                <input ref={fileInputRef} id="file-upload" type="file" accept=".csv, text/csv" onChange={handleFileChange} disabled={isProcessing} className={fileInputClasses} />
                 {fileName && <p className="text-xs text-slate-500 mt-1.5">Selected: {fileName}</p>}
              </div>
              <p className="text-xs text-slate-600">
                Ensure CSV has columns: "{emailColumnKey}", "{primeStatusColumnKey}", and "{brandColumnKey}". Save Excel as CSV first.
              </p>
              <button onClick={processFileEntries} disabled={isProcessing || !file} className={`${buttonPrimaryClasses} w-full mt-auto`}>
                {isProcessing ? 'Processing...' : 'Process File'}
              </button>
            </div>
          </div>
        </section>

        {/* Processing Log Section */}
        <section className={cardClasses}>
          <h2 className={headingClasses}>Processing Log</h2>
          {/* ... Log display JSX ... */}
           <div className="h-64 overflow-y-auto bg-slate-900 text-slate-200 p-4 rounded-md text-xs font-mono space-y-1">
            {logs.length > 0 ? logs.map((msg, index) => (
              <p key={index} className={`whitespace-pre-wrap ${
                msg.startsWith('Error:') || msg.startsWith('EXCEPTION:') ? 'text-red-400' :
                msg.includes('Successfully') ? 'text-green-400' :
                msg.startsWith('---') ? 'text-blue-400 font-semibold' : ''
              }`}>
                {msg}
              </p>
            )) : <p className="italic text-slate-400">Logs will appear here...</p>}
          </div>
        </section>
        
        {/* Results Table Section */}
        {/* ... (Results table JSX remains the same as previous version, it will dynamically pick up "Brand" if present in originalRowData) ... */}
         {processedResults.length > 0 && tableHeaders.length > 0 && (
          <section className={cardClasses}>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
              <h2 className={headingClasses}>Processing Results</h2>
              <button onClick={handleDownloadCsv} className={buttonSecondaryClasses}>Download Results as CSV</button>
            </div>
            <div className="overflow-x-auto max-h-[36rem] ring-1 ring-slate-200 rounded-lg">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100 sticky top-0 z-10">
                  <tr>
                    {tableHeaders.map(header => (
                      <th
                        key={header}
                        className="px-4 py-3 text-left font-semibold text-slate-700 whitespace-nowrap"
                        title={header}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {paginatedResults.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? '' : 'bg-slate-50/60'}>
                      {tableHeaders.map(header => {
                        let cellValue: string | number | boolean | undefined | null = '';
                        let cellClasses = 'px-4 py-2.5 text-slate-700 align-top';

                        if (header === "Task Status") {
                          cellValue = item.taskStatus;
                          cellClasses = `px-4 py-2.5 font-medium align-top ${
                            item.taskStatus.includes("Success") ? 'text-green-600' :
                            item.taskStatus.includes("Error") || item.taskStatus.includes("Fail") ? 'text-red-600' :
                            item.taskStatus.includes("No Membership") || item.taskStatus.includes("No Actionable") ? 'text-amber-700' :
                            'text-slate-600'}`;
                        } else if (header === "Task Message") {
                          cellValue = item.processedMessage;
                          cellClasses = 'px-4 py-2.5 text-slate-600 max-w-xs whitespace-pre-wrap break-words align-top';
                        } else if (item.originalRowData && item.originalRowData[header] !== undefined) {
                          cellValue = item.originalRowData[header];
                          cellClasses = 'px-4 py-2.5 text-slate-700 align-top whitespace-nowrap overflow-hidden text-ellipsis max-w-[250px]';
                        } else if (header === "Email (Processed)" && item.email) {
                            cellValue = item.email;
                            cellClasses = 'px-4 py-2.5 text-slate-700 align-top whitespace-nowrap overflow-hidden text-ellipsis max-w-[250px]';
                        } else if (header === "Prime Status (Processed)" && item.primeStatus) {
                            cellValue = item.primeStatus;
                            cellClasses = 'px-4 py-2.5 text-slate-700 align-top whitespace-nowrap overflow-hidden text-ellipsis max-w-[250px]';
                        } else if (header === "Brand (Processed)" && item.brand) { // For single entry if "Brand" is the key
                            cellValue = item.brand;
                            cellClasses = 'px-4 py-2.5 text-slate-700 align-top whitespace-nowrap overflow-hidden text-ellipsis max-w-[250px]';
                        }
                        return (
                          <td key={header} className={cellClasses} title={typeof cellValue === 'string' ? cellValue : String(cellValue)}>
                            {String(cellValue)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {processedResults.length === 0 && !isProcessing && <p className="text-center text-slate-500 py-4">No results to display.</p>}
            {isProcessing && processedResults.length === 0 && <p className="text-center text-slate-500 py-4">Processing... Please wait.</p>}
            {totalPages > 1 && (
              <nav className="flex items-center justify-between border-t border-slate-200 px-4 py-3 sm:px-6 mt-4" aria-label="Pagination">
                <div className="hidden sm:block">
                  <p className="text-sm text-slate-700">
                    Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, processedResults.length)}</span> of{' '}
                    <span className="font-medium">{processedResults.length}</span> results
                  </p>
                </div>
                <div className="flex-1 flex justify-between sm:justify-end space-x-2">
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className={paginationButtonClasses}>Previous</button>
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className={paginationButtonClasses}>Next</button>
                </div>
              </nav>
            )}
          </section>
        )}

        {/* AI Chat Section */}
        {(logs.length > 0 || originalCsvData.length > 0) && (
          <section className={cardClasses}>
            <ChatInterface logs={logs} csvData={originalCsvData} />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 mt-10 border-t border-slate-300 bg-slate-200">
        {/* ... Footer JSX with logo ... */}
        <div className="flex items-center justify-center space-x-2">
          <p className="text-sm text-slate-700">Made with</p>
          <span role="img" aria-label="love" className="text-red-500">❤️</span>
          <p className="text-sm text-slate-700">by</p>
          <div className="h-6 w-auto relative">
            <Image
              src="/Paco_primary_circle_light.png"
              alt="Paycomms Team Logo"
              width={24}
              height={24}
              className="inline-block"
            />
          </div>
          <p className="text-sm text-slate-700 font-semibold">Paycomms team.</p>
        </div>
      </footer>
    </div>
  );
}
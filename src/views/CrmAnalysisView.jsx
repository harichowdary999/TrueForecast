import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
  Download,
  ArrowRight,
  TrendingUp,
  LayoutDashboard,
  Users,
  Target
} from 'lucide-react';
import { uploadCrmCsv, predictDeal } from '../services/api';
import { formatINR } from '../utils/formatCurrency';

export function CrmAnalysisView() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [predictionReport, setPredictionReport] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    if (!file.name.endsWith('.csv')) {
      setUploadError({
        message: 'Invalid file type. Please upload a valid .csv spreadsheet file.',
        isValidationError: true,
      });
      return;
    }
    setSelectedFile(file);
    setUploading(true);
    setUploadError(null);
    setImportSummary(null);
    setPredictionReport(null);

    try {
      const uploadRes = await uploadCrmCsv(file);

      if (!uploadRes.success) {
        setUploadError({
          message: uploadRes.error || 'Failed to parse CRM file. Please check CSV columns.',
          isValidationError: uploadRes.status === 400 || uploadRes.status === 422,
        });
        setUploading(false);
        return;
      }

      setImportSummary(uploadRes.data);
      setUploading(false);

      // Auto-trigger prediction analysis on the ingested pipeline
      setAnalyzing(true);
      const topDeal = uploadRes.data.closureProbabilities?.[0];
      const predictRes = await predictDeal({
        name: topDeal ? topDeal.name || topDeal.deal_name : file.name.replace('.csv', '') + ' Portfolio',
        amount: topDeal ? topDeal.amount : (uploadRes.data.totalPipelineValue || 1500000),
        stage: topDeal ? topDeal.stage : 'Negotiation',
        daysInStage: 12,
      });

      if (predictRes.success && predictRes.data) {
        setPredictionReport(predictRes.data);
      }
    } catch (err) {
      console.error(err);
      setUploadError({
        message: err.message || 'An unexpected error occurred while uploading.',
        isValidationError: false,
      });
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const handleRunManualPredict = async () => {
    setAnalyzing(true);
    try {
      const topDeal = importSummary?.closureProbabilities?.[0];
      const res = await predictDeal({
        name: topDeal ? topDeal.name || topDeal.deal_name : selectedFile?.name || 'Enterprise CRM Ingestion Batch',
        amount: topDeal ? topDeal.amount : (importSummary?.totalPipelineValue || 2500000),
        stage: 'Contract Signature',
        daysInStage: 9,
      });
      if (res.success && res.data) {
        setPredictionReport(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDownloadMinimalCsv = () => {
    const sampleHeaders = 'deal_name,stage,amount\n';
    const sampleRows = [
      'Stark AI Platform,Negotiation,4500000',
      'Wayne Security Suite,Discovery,2800000',
      'Cyberdyne Core,Contract Signature,6200000',
    ].join('\n');

    const blob = new Blob([sampleHeaders + sampleRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'minimal_crm_pipeline.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadStandardCsv = () => {
    const sampleHeaders = 'deal_name,account_name,amount_inr,stage,close_date,sales_rep,health_score\n';
    const sampleRows = [
      'Acrobyte Enterprise Cloud,Acrobyte Technologies,12500000,Contract Signature,2026-10-14,Marcus Vance,96',
      'Apex Fleet Analytics Suite,Apex Logistics,3150000,Technical Pilot,2026-11-02,Elena Rostova,88',
      'OmniPay Gateway Core,OmniPay Global,4400000,Negotiation,2026-11-18,Devon Patel,61',
      'CloudScale Platform Migration,CloudScale Systems,6800000,Security Review,2026-10-28,Greg Sterling,34',
      'Vortex Financial Risk Engine,Vortex Financial,5200000,Discovery,2026-12-05,Priya Sharma,78',
    ].join('\n');

    const blob = new Blob([sampleHeaders + sampleRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'standard_crm_pipeline.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadKaggleCsv = () => {
    const sampleHeaders = 'opportunity_id,sales_agent,product,account,deal_stage,engage_date,close_date,close_value\n';
    const sampleRows = [
      '1ONQ0X5Z,Boris Faz,GTX Basic,Acme Corp,Won,2017-03-02,2017-05-22,1054',
      'OKH66US8,Boris Faz,GTX Pro,Stark Industries,Engaging,2017-02-14,,4500',
      'L52R37E0,Kami Bicknell,MG Special,Wayne Enterprises,Prospecting,2017-04-10,,3200',
      'V4Z1Q47G,Cecily Lampkin,GTX Plus Pro,Cyberdyne Systems,Lost,2017-01-18,2017-03-01,0',
    ].join('\n');

    const blob = new Blob([sampleHeaders + sampleRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kaggle_sales_pipeline.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-white border border-[#dcd1c1] rounded-xl p-6 shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#1f1d1a]">
              CRM Data Ingestion & Predictive ML Analysis
            </h1>
            <p className="text-xs text-[#6b645c] mt-1">
              Upload any CRM export. Minimal, standard, or Kaggle files are auto-parsed, unknown columns ignored, and missing values stored cleanly as blank.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadMinimalCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1f1d1a] bg-white border border-[#dcd1c1] rounded-lg hover:bg-[#f7f3ed] hover:border-[#c86d51] transition-colors shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#6b645c]" />
              <span>Minimal (3-col) CSV</span>
            </button>
            <button
              onClick={handleDownloadStandardCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1f1d1a] bg-white border border-[#dcd1c1] rounded-lg hover:bg-[#f7f3ed] hover:border-[#c86d51] transition-colors shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#6b645c]" />
              <span>Standard RevOps CSV</span>
            </button>
            <button
              onClick={handleDownloadKaggleCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1f1d1a] bg-white border border-[#dcd1c1] rounded-lg hover:bg-[#f7f3ed] hover:border-[#c86d51] transition-colors shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#6b645c]" />
              <span>Kaggle Maven CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Red Error Banner on Rejection / Network Error */}
      {uploadError && (
        <div className="p-4 bg-[#fae3e3] border border-[#f5c6c6] rounded-xl flex items-start gap-3.5 shadow-[0_1px_3px_rgba(31,29,26,0.05)] animate-fade-in">
          <div className="w-8 h-8 rounded-lg bg-[#fae3e3] flex items-center justify-center shrink-0 text-[#9e2a2b]">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-[#9e2a2b]">
              {uploadError.isValidationError ? 'Upload Validation Error' : 'Connection or Upload Error'}
            </h4>
            <p className="text-xs text-[#9e2a2b] mt-0.5 leading-relaxed font-medium">
              {uploadError.message || (typeof uploadError === 'string' ? uploadError : 'Failed to process file.')}
            </p>
            {uploadError.isValidationError && (
              <p className="text-[11px] text-[#9e2a2b] mt-2">
                Minimum requirements: core deal identifier (<code className="bg-[#fae3e3] border border-[#f5c6c6] px-1 py-0.5 rounded font-mono">deal_name</code> or <code className="bg-[#fae3e3] border border-[#f5c6c6] px-1 py-0.5 rounded font-mono">account_name</code>), stage (<code className="bg-[#fae3e3] border border-[#f5c6c6] px-1 py-0.5 rounded font-mono">stage</code> or <code className="bg-[#fae3e3] border border-[#f5c6c6] px-1 py-0.5 rounded font-mono">deal_stage</code>), and value (<code className="bg-[#fae3e3] border border-[#f5c6c6] px-1 py-0.5 rounded font-mono">amount</code> or <code className="bg-[#fae3e3] border border-[#f5c6c6] px-1 py-0.5 rounded font-mono">close_value</code>). All extra columns are ignored and missing optional fields are left blank.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Success Notification Banner on Valid Upload */}
      {importSummary && (
        <div className="p-4 bg-[#e2f2ee] border border-[#b8e2d7] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#e2f2ee] flex items-center justify-center shrink-0 text-[#115e4d]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#115e4d]">
                CRM Pipeline Ingested Successfully
              </h4>
              <p className="text-xs text-[#115e4d] mt-0.5">
                {importSummary.dealsAdded ?? importSummary.deals_added ?? 0} deals added to Neon PostgreSQL. All tabs are now updated with real live data.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#b8e2d7] rounded-lg text-xs font-semibold text-[#115e4d] hover:bg-[#e2f2ee] transition-colors shadow-2xs"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/pipeline"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#b8e2d7] rounded-lg text-xs font-semibold text-[#115e4d] hover:bg-[#e2f2ee] transition-colors shadow-2xs"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Pipeline</span>
            </Link>
            <Link
              to="/forecast"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#b8e2d7] rounded-lg text-xs font-semibold text-[#115e4d] hover:bg-[#e2f2ee] transition-colors shadow-2xs"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Forecast</span>
            </Link>
            <Link
              to="/customers"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#b8e2d7] rounded-lg text-xs font-semibold text-[#115e4d] hover:bg-[#e2f2ee] transition-colors shadow-2xs"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Customers</span>
            </Link>
          </div>
        </div>
      )}

      {/* Drag-and-Drop CSV Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all shadow-[0_1px_3px_rgba(31,29,26,0.05)] ${
          dragActive
            ? 'border-[#c86d51] bg-[#f7f3ed]'
            : 'bg-[#f7f3ed] border-[#dcd1c1] hover:border-[#c86d51] hover:bg-[#f7f3ed]/70'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-12 h-12 rounded-xl bg-white border border-[#dcd1c1] flex items-center justify-center mx-auto mb-3 text-[#1f1d1a]">
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-[#1f1d1a]" />
          ) : (
            <UploadCloud className="w-6 h-6 text-[#1f1d1a]" />
          )}
        </div>

        <p className="text-sm font-semibold text-[#1f1d1a]">
          {selectedFile ? selectedFile.name : 'Drop your CRM CSV file here or click to browse'}
        </p>
        <p className="text-xs text-[#6b645c] mt-1">
          Supports Kaggle Maven sales pipeline CSV and standard RevOps CRM exports (max 25MB)
        </p>

        {selectedFile && !uploading && !uploadError && (
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#115e4d] bg-[#e2f2ee] px-2.5 py-1 rounded-full border border-[#b8e2d7]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            File Loaded: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
          </div>
        )}
      </div>

      {/* Import Summary & Prediction Report */}
      {importSummary && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Import Summary Card */}
          <div className="lg:col-span-5 bg-white border border-[#dcd1c1] rounded-xl p-6 shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#dcd1c1]">
              <div>
                <h3 className="text-sm font-bold text-[#1f1d1a] uppercase tracking-wider">
                  Ingestion Summary
                </h3>
                <p className="text-[11px] text-[#6b645c] mt-0.5">POST /api/upload-crm · Neon PostgreSQL</p>
              </div>
              <span className="text-[10px] font-semibold text-[#115e4d] bg-[#e2f2ee] border border-[#b8e2d7] px-2 py-0.5 rounded-full">
                Live Ingested
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-[#f7f3ed] rounded-lg border border-[#dcd1c1]">
                <span className="text-[#6b645c]">Source File</span>
                <span className="font-semibold text-[#1f1d1a] truncate max-w-[180px]">
                  {importSummary.filename || selectedFile?.name}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#f7f3ed] rounded-lg border border-[#dcd1c1]">
                <span className="text-[#6b645c]">Rows Parsed</span>
                <span className="font-semibold text-[#1f1d1a] tabular-nums">
                  {Number(importSummary.rowsParsed ?? importSummary.rows_parsed ?? importSummary.totalRows ?? importSummary.total_rows ?? 0).toLocaleString()} records
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#f7f3ed] rounded-lg border border-[#dcd1c1]">
                <span className="text-[#6b645c]">Deals Added to Pipeline</span>
                <span className="font-semibold text-[#1f1d1a] tabular-nums">
                  {Number(importSummary.dealsAdded ?? importSummary.deals_added ?? importSummary.inserted ?? 0).toLocaleString()} active deals
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#f7f3ed] rounded-lg border border-[#dcd1c1]">
                <span className="text-[#6b645c]">Total Pipeline Value</span>
                <span className="font-bold text-[#1f1d1a] tabular-nums">
                  {formatINR(importSummary.totalPipelineValue || importSummary.total_pipeline_value || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#f7f3ed] rounded-lg border border-[#dcd1c1]">
                <span className="text-[#6b645c]">Average ML Win Probability</span>
                <span className="font-bold text-[#157f68] tabular-nums">
                  {importSummary.averageClosureProbability || importSummary.average_closure_probability || 0}%
                </span>
              </div>
            </div>

            <div className="pt-3 flex items-center gap-2">
              <Link
                to="/"
                className="flex-1 text-center py-2 px-3 bg-white border border-[#dcd1c1] hover:bg-[#f7f3ed] text-[#1f1d1a] text-xs font-semibold rounded-lg transition-colors shadow-2xs"
              >
                View Dashboard →
              </Link>
              <Link
                to="/pipeline"
                className="flex-1 text-center py-2 px-3 bg-white border border-[#dcd1c1] hover:bg-[#f7f3ed] text-[#1f1d1a] text-xs font-semibold rounded-lg transition-colors shadow-2xs"
              >
                View Pipeline →
              </Link>
            </div>

            <button
              onClick={handleRunManualPredict}
              disabled={analyzing}
              className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#c86d51] hover:bg-[#b35c42] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Running Predictive ML Calibrations...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  Re-Analyze Deal Predictions
                </>
              )}
            </button>
          </div>

          {/* Predictive ML Generated Report Card */}
          <div className="lg:col-span-7 bg-white border border-[#dcd1c1] rounded-xl p-6 shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#dcd1c1]">
              <div>
                <h3 className="text-sm font-bold text-[#1f1d1a] uppercase tracking-wider">
                  Predictive ML Report Card
                </h3>
                <p className="text-[11px] text-[#6b645c] mt-0.5">POST /api/predict · Logistic Regression</p>
              </div>
              {predictionReport && (
                <span className="text-[10px] font-semibold text-[#2b5b6c] bg-[#e8f1f5] border border-[#c0d8e2] px-2 py-0.5 rounded-full">
                  {predictionReport.confidenceBand}
                </span>
              )}
            </div>

            {analyzing ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#1f1d1a]" />
                <span className="text-xs text-[#6b645c]">Evaluating Logistic Regression weights & ML coefficients...</span>
              </div>
            ) : predictionReport ? (
              <div className="space-y-5">
                {/* Closure Probability Strip */}
                <div className="bg-[#f7f3ed] border border-[#dcd1c1] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-[#6b645c] uppercase tracking-wider">
                      Deal Closure Probability
                    </span>
                    <span className="text-2xl font-black text-[#1f1d1a] tabular-nums">
                      {predictionReport.closureProbability}%
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-[#dcd1c1] h-2.5 rounded-full overflow-hidden mt-2">
                    <div
                      style={{ width: `${predictionReport.closureProbability}%` }}
                      className="h-full bg-[#157f68] rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* ML Win Drivers */}
                <div>
                  <h4 className="text-xs font-bold text-[#1f1d1a] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#157f68]" />
                    Key Win Drivers (Logistic Regression Feature Attribution)
                  </h4>
                  <ul className="space-y-1.5 text-xs text-[#1f1d1a]">
                    {(predictionReport.winDrivers || []).map((driver, idx) => (
                      <li key={idx} className="flex items-start gap-2 p-2 bg-[#f7f3ed] rounded border border-[#dcd1c1]">
                        <span className="text-[#157f68] font-bold shrink-0">+</span>
                        <span>{driver}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* ML Risk Factors */}
                <div>
                  <h4 className="text-xs font-bold text-[#1f1d1a] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-[#c86d51]" />
                    Identified Risk Factors
                  </h4>
                  <ul className="space-y-1.5 text-xs text-[#1f1d1a]">
                    {(predictionReport.riskFactors || []).map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-2 p-2 bg-[#f7f3ed] rounded border border-[#dcd1c1]">
                        <span className="text-[#c86d51] font-bold shrink-0">!</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommended Next Action */}
                {predictionReport.recommendedNextAction && (
                  <div className="p-3 bg-[#e8f1f5] border border-[#c0d8e2] rounded-lg text-xs text-[#2b5b6c]">
                    <span className="font-semibold">Next Action Recommendation:</span> {predictionReport.recommendedNextAction}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

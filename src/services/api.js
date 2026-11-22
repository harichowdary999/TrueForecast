import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch all deals from the backend database
 */
export async function fetchDeals() {
  try {
    const response = await apiClient.get('/api/deals');
    return { data: Array.isArray(response.data) ? response.data : [], source: 'backend' };
  } catch (error) {
    console.error('Error fetching deals from backend:', error.message);
    return { data: [], source: 'backend', error: error.message };
  }
}

/**
 * Fetch dashboard summary metrics
 */
export async function fetchDashboardSummary() {
  try {
    const response = await apiClient.get('/api/dashboard/summary');
    return { data: response.data || null, source: 'backend' };
  } catch (error) {
    console.error('Error fetching dashboard summary from backend:', error.message);
    return { data: null, source: 'backend', error: error.message };
  }
}

/**
 * Fetch quarterly revenue forecast
 */
export async function fetchForecast() {
  try {
    const response = await apiClient.get('/api/forecast');
    return { data: response.data || { quarters: [] }, source: 'backend' };
  } catch (error) {
    console.error('Error fetching forecast from backend:', error.message);
    return {
      data: {
        quarters: [],
        totalExecutiveTarget: 0,
        totalMlProjected: 0,
        variancePercent: 0,
        activeDealsCount: 0,
      },
      source: 'backend',
      error: error.message,
    };
  }
}

/**
 * Fetch customers accounts directory with summary counts and owners
 */
export async function fetchCustomers() {
  try {
    const response = await apiClient.get('/api/customers');
    const data = response.data;
    if (Array.isArray(data)) {
      return {
        data: data,
        customers: data,
        summary: {
          totalRelationships: data.length,
          activeConversations: data.length,
          newLeads: 0,
          customersCount: data.length,
        },
        owners: [],
        source: 'backend',
      };
    }
    const customerList = Array.isArray(data?.customers) ? data.customers : [];
    return {
      data: customerList,
      customers: customerList,
      summary: data?.summary || {
        totalRelationships: customerList.length,
        activeConversations: customerList.length,
        newLeads: 0,
        customersCount: customerList.length,
      },
      owners: Array.isArray(data?.owners) ? data.owners : [],
      source: 'backend',
    };
  } catch (error) {
    console.error('Error fetching customers from backend:', error.message);
    return {
      data: [],
      customers: [],
      summary: {
        totalRelationships: 0,
        activeConversations: 0,
        newLeads: 0,
        customersCount: 0,
      },
      owners: [],
      source: 'backend',
      error: error.message,
    };
  }
}

/**
 * Update a deal's stage (used by Pipeline Kanban board)
 */
export async function updateDealStage(dealId, newStage) {
  try {
    const response = await apiClient.patch(`/api/deals/${dealId}/stage`, { stage: newStage });
    return { success: true, data: response.data, source: 'backend' };
  } catch (error) {
    console.error(`Error updating stage for deal ${dealId}:`, error.message);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to update deal stage.',
    };
  }
}

/**
 * Create a new deal in Neon PostgreSQL
 */
export async function createDeal(dealData) {
  try {
    const response = await apiClient.post('/api/deals', dealData);
    return { success: true, data: response.data, source: 'backend' };
  } catch (error) {
    console.error('Error creating deal:', error.message);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to create deal.',
    };
  }
}

/**
 * Fetch a single deal by ID
 */
export async function fetchDealById(dealId) {
  try {
    const response = await apiClient.get(`/api/deals/${dealId}`);
    return { data: response.data || null, source: 'backend' };
  } catch (error) {
    console.error(`Error fetching deal ${dealId} from backend:`, error.message);
    return { data: null, source: 'backend', error: error.message };
  }
}

/**
 * Upload raw CRM CSV to /api/upload-crm
 * Strictly validates CSV on backend and never falls back to fake simulation.
 */
export async function uploadCrmCsv(file) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await apiClient.post('/api/upload-crm', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // 120 seconds for large CRM files (~8,800 rows)
    });
    return { success: true, data: response.data, source: 'backend' };
  } catch (error) {
    const errorDetail =
      error.response?.data?.detail ||
      error.message ||
      'Failed to upload and process CRM CSV file.';
    console.error('Upload CRM CSV error:', errorDetail);
    return {
      success: false,
      error: errorDetail,
      status: error.response?.status || 500,
    };
  }
}

/**
 * Call predictive Logistic Regression ML model on a deal
 */
export async function predictDeal(dealData) {
  try {
    const response = await apiClient.post('/api/predict', dealData);
    return { success: true, data: response.data, source: 'backend' };
  } catch (error) {
    const errorDetail =
      error.response?.data?.detail ||
      error.message ||
      'Prediction inference failed.';
    console.error('Predict deal error:', errorDetail);
    return { success: false, error: errorDetail };
  }
}

/**
 * Fetch all tasks from backend with summary counts
 */
export async function fetchTasks() {
  try {
    const response = await apiClient.get('/api/tasks');
    return {
      data: response.data?.tasks || [],
      tasks: response.data?.tasks || [],
      summary: response.data?.summary || {
        total: 0,
        open: 0,
        past_due: 0,
        completed: 0,
        follow_ups_need_attention: 0,
      },
      source: 'backend',
    };
  } catch (error) {
    console.error('Error fetching tasks from backend:', error.message);
    return {
      data: [],
      tasks: [],
      summary: {
        total: 0,
        open: 0,
        past_due: 0,
        completed: 0,
        follow_ups_need_attention: 0,
      },
      source: 'backend',
      error: error.message,
    };
  }
}

/**
 * Create a new task in Neon PostgreSQL
 */
export async function createTask(taskData) {
  try {
    const response = await apiClient.post('/api/tasks', taskData);
    return { success: true, data: response.data, source: 'backend' };
  } catch (error) {
    console.error('Error creating task:', error.message);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to create task.',
    };
  }
}

/**
 * Update an existing task (status, title, due_date, etc.)
 */
export async function updateTask(taskId, taskData) {
  try {
    const response = await apiClient.patch(`/api/tasks/${taskId}`, taskData);
    return { success: true, data: response.data, source: 'backend' };
  } catch (error) {
    console.error(`Error updating task ${taskId}:`, error.message);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to update task.',
    };
  }
}

/**
 * Delete a task from Neon PostgreSQL
 */
export async function deleteTask(taskId) {
  try {
    const response = await apiClient.delete(`/api/tasks/${taskId}`);
    return { success: true, data: response.data, source: 'backend' };
  } catch (error) {
    console.error(`Error deleting task ${taskId}:`, error.message);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to delete task.',
    };
  }
}

/**
 * Fetch all sales representatives from Neon PostgreSQL with live metrics
 */
export async function fetchSalesReps() {
  try {
    const response = await apiClient.get('/api/sales-reps');
    const data = response.data;
    const reps = Array.isArray(data?.sales_reps)
      ? data.sales_reps
      : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data)
      ? data
      : [];

    return {
      data: reps,
      sales_reps: reps,
      summary: data?.summary || {
        total_reps: reps.length,
        total_active_pipeline: 0,
        average_attainment_pct: 0,
        target_exceeded_count: 0,
        on_track_count: 0,
        at_risk_count: 0,
      },
      source: 'backend',
    };
  } catch (error) {
    console.error('Error fetching sales reps from backend:', error.message);
    return {
      data: [],
      sales_reps: [],
      summary: {
        total_reps: 0,
        total_active_pipeline: 0,
        average_attainment_pct: 0,
        target_exceeded_count: 0,
        on_track_count: 0,
        at_risk_count: 0,
      },
      source: 'backend',
      error: error.message,
    };
  }
}

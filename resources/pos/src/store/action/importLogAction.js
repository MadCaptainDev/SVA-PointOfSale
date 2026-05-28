import apiConfig from '../../config/apiConfig';
import { addToast } from './toastAction';

export const IMPORT_LOGS_FETCH  = 'IMPORT_LOGS_FETCH';
export const IMPORT_LOG_DETAIL  = 'IMPORT_LOG_DETAIL';
export const IMPORT_LOGS_CLEAR  = 'IMPORT_LOGS_CLEAR';

export const fetchImportLogs = () => async (dispatch) => {
    try {
        const response = await apiConfig.get('import-logs');
        dispatch({ type: IMPORT_LOGS_FETCH, payload: response.data.data });
    } catch (error) {
        dispatch(addToast({
            text: error.response?.data?.message || 'Failed to load import history.',
            type: 'error',
        }));
    }
};

export const fetchImportLogDetail = (id) => async (dispatch) => {
    try {
        const response = await apiConfig.get(`import-logs/${id}`);
        dispatch({ type: IMPORT_LOG_DETAIL, payload: response.data.data });
    } catch (error) {
        dispatch(addToast({
            text: error.response?.data?.message || 'Failed to load import log.',
            type: 'error',
        }));
    }
};

import { IMPORT_LOGS_FETCH, IMPORT_LOG_DETAIL, IMPORT_LOGS_CLEAR } from '../action/importLogAction';

const initialState = {
    logs: [],
    detail: null,
};

export default function importLogReducer(state = initialState, action) {
    switch (action.type) {
        case IMPORT_LOGS_FETCH:
            return { ...state, logs: action.payload };
        case IMPORT_LOG_DETAIL:
            return { ...state, detail: action.payload };
        case IMPORT_LOGS_CLEAR:
            return initialState;
        default:
            return state;
    }
}

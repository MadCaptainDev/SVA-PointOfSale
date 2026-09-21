import { staffActionType } from "../../constants";

export default (state = [], action) => {
    switch (action.type) {
        case staffActionType.FETCH_STAFF:
            return action.payload;
        case staffActionType.FETCH_STAFF_MEMBER:
            return [action.payload];
        case staffActionType.ADD_STAFF:
            return action.payload;
        case staffActionType.EDIT_STAFF:
            return state.map((item) =>
                item.id === +action.payload.id ? action.payload : item
            );
        case staffActionType.DELETE_STAFF:
            return state.filter((item) => item.id !== action.payload);
        default:
            return state;
    }
};

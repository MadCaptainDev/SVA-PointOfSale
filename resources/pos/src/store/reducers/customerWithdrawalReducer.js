import { customerWithdrawalActionType } from "../../constants";

export default (state = [], action) => {
    switch (action.type) {
        case customerWithdrawalActionType.FETCH_CUSTOMER_WITHDRAWALS:
            return action.payload;
        case customerWithdrawalActionType.FETCH_CUSTOMER_WITHDRAWAL:
            return [action.payload];
        case customerWithdrawalActionType.ADD_CUSTOMER_WITHDRAWAL:
            return [...state, action.payload];
        case customerWithdrawalActionType.EDIT_CUSTOMER_WITHDRAWAL:
            return state.map((item) =>
                item.id === +action.payload.id ? action.payload : item
            );
        case customerWithdrawalActionType.DELETE_CUSTOMER_WITHDRAWAL:
            return state.filter((item) => item.id !== action.payload);
        default:
            return state;
    }
};

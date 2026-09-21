import { staffIncentivePayoutActionType } from "../../constants";

export default (state = [], action) => {
    switch (action.type) {
        case staffIncentivePayoutActionType.FETCH_STAFF_INCENTIVE_PAYOUTS:
            return action.payload;
        case staffIncentivePayoutActionType.ADD_STAFF_INCENTIVE_PAYOUT:
            return [action.payload, ...state];
        default:
            return state;
    }
};

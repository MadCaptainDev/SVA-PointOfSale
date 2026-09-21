import { staffIncentiveEarningActionType } from "../../constants";

export default (state = [], action) => {
    switch (action.type) {
        case staffIncentiveEarningActionType.FETCH_STAFF_INCENTIVE_EARNINGS:
            return action.payload;
        default:
            return state;
    }
};

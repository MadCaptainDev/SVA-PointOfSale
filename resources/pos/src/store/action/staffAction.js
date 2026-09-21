import apiConfig from "../../config/apiConfig";
import { apiBaseURL, staffActionType, toastType } from "../../constants";
import requestParam from "../../shared/requestParam";
import { addToast } from "./toastAction";
import {
    setTotalRecord,
    addInToTotalRecord,
    removeFromTotalRecord,
} from "./totalRecordAction";
import { setLoading } from "./loadingAction";
import { getFormattedMessage } from "../../shared/sharedMethod";
import { setSavingButton } from "./saveButtonAction";

export const fetchStaff =
    (filter = {}, isLoading = true) =>
    async (dispatch) => {
        if (isLoading) {
            dispatch(setLoading(true));
        }
        let url = apiBaseURL.STAFF;
        if (filter && filter.pageSize === 0) {
            url += "?page[size]=0";
        } else if (
            !_.isEmpty(filter) &&
            (filter.page ||
                filter.pageSize ||
                filter.search ||
                filter.order_By ||
                filter.created_at)
        ) {
            url += requestParam(filter, null, null, null, url);
        }
        apiConfig
            .get(url)
            .then((response) => {
                dispatch({
                    type: staffActionType.FETCH_STAFF,
                    payload: response.data.data,
                });
                if (filter && filter.pageSize === 0) {
                    // skip total record for dropdown loads
                } else {
                    dispatch(
                        setTotalRecord(
                            response.data.meta.total !== undefined &&
                                response.data.meta.total >= 0
                                ? response.data.meta.total
                                : response.data.data.total
                        )
                    );
                }
                if (isLoading) {
                    dispatch(setLoading(false));
                }
            })
            .catch(({ response }) => {
                if (isLoading) {
                    dispatch(setLoading(false));
                }
                dispatch(
                    addToast({
                        text: response.data.message,
                        type: toastType.ERROR,
                    })
                );
            });
    };

export const fetchStaffMember =
    (staffId, isLoading = true) =>
    async (dispatch) => {
        if (isLoading) {
            dispatch(setLoading(true));
        }
        apiConfig
            .get(apiBaseURL.STAFF + "/" + staffId)
            .then((response) => {
                dispatch({
                    type: staffActionType.FETCH_STAFF_MEMBER,
                    payload: response.data.data,
                });
                if (isLoading) {
                    dispatch(setLoading(false));
                }
            })
            .catch(({ response }) => {
                dispatch(
                    addToast({
                        text: response.data.message,
                        type: toastType.ERROR,
                    })
                );
            });
    };

export const addStaff = (staff, navigate) => async (dispatch) => {
    dispatch(setSavingButton(true));
    await apiConfig
        .post(apiBaseURL.STAFF, staff)
        .then((response) => {
            dispatch({
                type: staffActionType.ADD_STAFF,
                payload: response.data.data,
            });
            dispatch(
                addToast({
                    text: getFormattedMessage("staff.success.create.message"),
                })
            );
            navigate("/app/staff");
            dispatch(addInToTotalRecord(1));
            dispatch(setSavingButton(false));
        })
        .catch(({ response }) => {
            dispatch(setSavingButton(false));
            dispatch(
                addToast({ text: response.data.message, type: toastType.ERROR })
            );
        });
};

export const editStaff = (staffId, staff, navigate) => async (dispatch) => {
    dispatch(setSavingButton(true));
    apiConfig
        .post(apiBaseURL.STAFF + "/" + staffId, staff)
        .then((response) => {
            dispatch({
                type: staffActionType.EDIT_STAFF,
                payload: response.data.data,
            });
            dispatch(
                addToast({
                    text: getFormattedMessage("staff.success.edit.message"),
                })
            );
            navigate("/app/staff");
            dispatch(setSavingButton(false));
        })
        .catch(({ response }) => {
            dispatch(setSavingButton(false));
            dispatch(
                addToast({ text: response.data.message, type: toastType.ERROR })
            );
        });
};

export const deleteStaff = (staffId) => async (dispatch) => {
    apiConfig
        .delete(apiBaseURL.STAFF + "/" + staffId)
        .then(() => {
            dispatch(removeFromTotalRecord(1));
            dispatch({ type: staffActionType.DELETE_STAFF, payload: staffId });
            dispatch(
                addToast({
                    text: getFormattedMessage("staff.success.delete.message"),
                })
            );
        })
        .catch(({ response }) => {
            dispatch(
                addToast({ text: response.data.message, type: toastType.ERROR })
            );
        });
};

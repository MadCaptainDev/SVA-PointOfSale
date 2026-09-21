import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { Modal, Button, Form } from "react-bootstrap";
import moment from "moment";
import {
    fetchStaffIncentivePayouts,
    addStaffIncentivePayout,
} from "../../store/action/staffIncentiveAction";
import { fetchStaff } from "../../store/action/staffAction";
import ReactDataTable from "../../shared/table/ReactDataTable";
import {
    getFormattedDate,
    getFormattedMessage,
    placeholderText,
} from "../../shared/sharedMethod";
import ReactSelect from "../../shared/select/reactSelect";

const StaffIncentivePayouts = (props) => {
    const {
        fetchStaffIncentivePayouts,
        addStaffIncentivePayout,
        fetchStaff,
        staffIncentivePayouts,
        staff,
        totalRecord,
        isLoading,
        allConfigData,
        isSaving,
    } = props;

    const [showModal, setShowModal] = useState(false);
    const [formValue, setFormValue] = useState({
        user_id: "",
        amount: "",
        note: "",
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchStaff({ pageSize: 0 }, false);
    }, []);

    const onChange = (filter) => {
        fetchStaffIncentivePayouts(filter, true);
    };

    const staffOptions =
        staff &&
        staff.map((member) => ({
            id: member.attributes.user_id,
            name: `${member.attributes.first_name} ${member.attributes.last_name}`,
        }));

    const itemsValue =
        staffIncentivePayouts.length >= 0 &&
        staffIncentivePayouts.map((payout) => ({
            date: getFormattedDate(
                payout.attributes.paid_at || payout.attributes.created_at,
                allConfigData && allConfigData
            ),
            time: moment(
                payout.attributes.paid_at || payout.attributes.created_at
            ).format("LT"),
            staff_name: payout.attributes.staff_name,
            amount: payout.attributes.amount,
            note: payout.attributes.note,
            created_by_name: payout.attributes.created_by_name,
            id: payout.id,
        }));

    const currency = (amount) =>
        `${
            allConfigData && allConfigData.hasOwnProperty("currency_symbol")
                ? allConfigData.currency_symbol
                : ""
        } ${amount}`;

    const columns = [
        {
            name: getFormattedMessage("staff.table.staff.column.title"),
            selector: (row) => row.staff_name,
            sortField: "user_id",
            sortable: true,
        },
        {
            name: getFormattedMessage(
                "customer-withdrawal.table.amount.column.title"
            ),
            selector: (row) => row.amount,
            sortField: "amount",
            sortable: true,
            cell: (row) => currency(row.amount),
        },
        {
            name: getFormattedMessage("staff.input.notes.label"),
            selector: (row) => row.note,
            sortField: "note",
            sortable: false,
        },
        {
            name: getFormattedMessage(
                "staff-incentive.table.paid-by.column.title"
            ),
            selector: (row) => row.created_by_name,
            sortable: false,
        },
        {
            name: getFormattedMessage(
                "globally.react-table.column.created-date.label"
            ),
            selector: (row) => row.date,
            sortField: "paid_at",
            sortable: true,
            cell: (row) => (
                <span className="badge bg-light-info">
                    <div className="mb-1">{row.time}</div>
                    {row.date}
                </span>
            ),
        },
    ];

    const handleValidation = () => {
        const next = {};
        let valid = true;
        if (!formValue.user_id) {
            next.user_id = getFormattedMessage(
                "staff-incentive.payout.staff.validate"
            );
            valid = false;
        }
        if (!formValue.amount || Number(formValue.amount) <= 0) {
            next.amount = getFormattedMessage(
                "staff-incentive.payout.amount.validate"
            );
            valid = false;
        }
        setErrors(next);
        return valid;
    };

    const onStaffChange = (obj) => {
        setFormValue((v) => ({ ...v, user_id: obj }));
        setErrors({});
    };

    const hideModal = () => {
        setShowModal(false);
        setFormValue({ user_id: "", amount: "", note: "" });
        setErrors({});
        fetchStaffIncentivePayouts({}, true);
    };

    const onSubmit = (e) => {
        e.preventDefault();
        if (!handleValidation()) {
            return;
        }
        const payload = {
            user_id: formValue.user_id.value || formValue.user_id,
            amount: formValue.amount,
            note: formValue.note || null,
        };
        addStaffIncentivePayout(payload, hideModal);
    };

    return (
        <>
            <div className="d-flex justify-content-end mb-3">
                <Button variant="primary" onClick={() => setShowModal(true)}>
                    {getFormattedMessage("staff-incentive.payout.create.title")}
                </Button>
            </div>
            <ReactDataTable
                columns={columns}
                items={itemsValue}
                onChange={onChange}
                isLoading={isLoading}
                totalRows={totalRecord}
            />
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {getFormattedMessage(
                            "staff-incentive.payout.create.title"
                        )}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={onSubmit}>
                    <Modal.Body>
                        <div className="mb-3">
                            <ReactSelect
                                multiLanguageOption={staffOptions}
                                onChange={onStaffChange}
                                name="user_id"
                                title={getFormattedMessage(
                                    "staff.table.staff.column.title"
                                )}
                                errors={errors.user_id}
                                placeholder={placeholderText(
                                    "staff-incentive.payout.staff.placeholder"
                                )}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">
                                {getFormattedMessage(
                                    "customer-withdrawal.table.amount.column.title"
                                )}
                                :<span className="required" />
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-control"
                                value={formValue.amount}
                                onChange={(e) =>
                                    setFormValue({
                                        ...formValue,
                                        amount: e.target.value,
                                    })
                                }
                            />
                            {errors.amount ? (
                                <span className="text-danger">
                                    {errors.amount}
                                </span>
                            ) : null}
                        </div>
                        <div className="mb-3">
                            <label className="form-label">
                                {getFormattedMessage("staff.input.notes.label")}
                                :
                            </label>
                            <textarea
                                className="form-control"
                                rows="3"
                                value={formValue.note}
                                onChange={(e) =>
                                    setFormValue({
                                        ...formValue,
                                        note: e.target.value,
                                    })
                                }
                            />
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            onClick={() => setShowModal(false)}
                        >
                            {getFormattedMessage("globally.cancel-btn")}
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            disabled={isSaving}
                        >
                            {getFormattedMessage("globally.save-btn")}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
};

const mapStateToProps = (state) => {
    const {
        staffIncentivePayouts,
        staff,
        totalRecord,
        isLoading,
        allConfigData,
        isSaving,
    } = state;
    return {
        staffIncentivePayouts,
        staff,
        totalRecord,
        isLoading,
        allConfigData,
        isSaving,
    };
};

export default connect(mapStateToProps, {
    fetchStaffIncentivePayouts,
    addStaffIncentivePayout,
    fetchStaff,
})(StaffIncentivePayouts);

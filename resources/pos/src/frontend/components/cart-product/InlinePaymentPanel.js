import React, { useEffect, useState } from "react";
import { Form, InputGroup, FormControl } from "react-bootstrap-v5";
import { useDispatch } from "react-redux";
import {
    currencySymbolHandling,
    getFormattedMessage,
    getFormattedOptions,
    placeholderText,
} from "../../../shared/sharedMethod";
import ReactSelect from "../../../shared/select/reactSelect";
import { addToast } from "../../../store/action/toastAction";
import { salePaymentStatusOptions, toastType } from "../../../constants";

const InlinePaymentPanel = (props) => {
    const {
        grandTotal,
        totalQty,
        subTotal,
        taxTotal,
        cartItemValue,
        settings,
        allConfigData,
        frontSetting,
        cashPaymentValue,
        onChangeInput,
        onPaymentStatusChange,
        onPaymentTypeChange,
        onCashPayment,
        onChangeReturnChange,
        errors,
        paymentTypeDefaultValue,
        paymentTypeFilterOptions,
        updateProducts,
    } = props;

    const dispatch = useDispatch();
    const [summation, setSummation] = useState(0);

    const symbol = frontSetting.value && frontSetting.value.currency_symbol;

    useEffect(() => {
        const received = parseFloat(cashPaymentValue.received_amount) || 0;
        const total = parseFloat(grandTotal) || 0;
        setSummation(received - total);
    }, [cashPaymentValue.received_amount, grandTotal]);

    useEffect(() => {
        onChangeReturnChange(summation);
    }, [summation]);

    const paymentStatusFilterOptions = getFormattedOptions(salePaymentStatusOptions);
    const paymentStatusDefaultValue = paymentStatusFilterOptions.map((o) => ({ value: o.id, label: o.name }));

    const tenderAmount = currencySymbolHandling(
        allConfigData, symbol,
        cashPaymentValue.received_amount ? parseFloat(cashPaymentValue.received_amount).toFixed(2) : "0.00"
    );
    const returnAmount = currencySymbolHandling(
        allConfigData, symbol,
        summation ? Math.abs(summation).toFixed(2) : "0.00"
    );

    const handleCompleteSale = (e) => {
        if (!updateProducts || updateProducts.length === 0) {
            dispatch(addToast({ text: getFormattedMessage("pos.cash-payment.product-error.message"), type: toastType.ERROR }));
            return;
        }
        onCashPayment(e);
    };

    return (
        <div>
            {/* Total card */}
            <div className="total-card">
                <div className="tc-label">Net Payable</div>
                <div className="tc-amount">
                    {currencySymbolHandling(allConfigData, symbol, grandTotal || "0.00")}
                </div>
                <div className="mini-totals">
                    <div>
                        <div className="mt-lbl">Tender</div>
                        <div className="mt-val">{tenderAmount}</div>
                    </div>
                    <div>
                        <div className="mt-lbl">{summation < 0 ? "Due" : "Return"}</div>
                        <div className="mt-val" style={{ color: summation < 0 ? "#fbbf24" : "inherit" }}>
                            {returnAmount}
                        </div>
                    </div>
                </div>

                {/* Payment Status */}
                <div className="mb-3">
                    <label>{getFormattedMessage("pos.payment-status.label") || "Payment Status"}</label>
                    <ReactSelect
                        data={paymentStatusDefaultValue}
                        onChange={onPaymentStatusChange}
                        defaultValue={cashPaymentValue.payment_status}
                        placeholder={placeholderText("pos.payment-status.label")}
                    />
                </div>

                {/* Payment Type (only when paid) */}
                {cashPaymentValue.payment_status && cashPaymentValue.payment_status.value === 1 && (
                    <div className="mb-3">
                        <label>{getFormattedMessage("pos.payment-type.label") || "Payment Type"}</label>
                        <ReactSelect
                            data={paymentTypeDefaultValue}
                            onChange={onPaymentTypeChange}
                            defaultValue={paymentTypeDefaultValue[0]}
                            placeholder={placeholderText("pos.payment-type.label")}
                        />
                    </div>
                )}

                {/* Received Amount */}
                <div className="mb-3">
                    <label>{getFormattedMessage("pos.received-amount.label") || "Received Amount"}</label>
                    <InputGroup>
                        <InputGroup.Text>{symbol || "$"}</InputGroup.Text>
                        <FormControl
                            type="number"
                            name="received_amount"
                            placeholder="0.00"
                            onChange={onChangeInput}
                            value={cashPaymentValue.received_amount || ""}
                            min="0"
                            step="0.01"
                        />
                    </InputGroup>
                </div>

                {/* Notes */}
                <div className="mb-3">
                    <label>{getFormattedMessage("pos.payment-note.label") || "Note (optional)"}</label>
                    <FormControl
                        as="textarea"
                        rows={2}
                        name="notes"
                        placeholder="Add a note..."
                        onChange={onChangeInput}
                        value={cashPaymentValue.notes || ""}
                        maxLength={100}
                    />
                    {errors.notes && <small style={{ color: "#ef4444" }}>{errors.notes}</small>}
                </div>

                {/* Complete Sale */}
                <button
                    type="button"
                    className="btn-modern btn-success-m w-100 justify-content-center"
                    style={{ padding: "14px", fontSize: "15px" }}
                    onClick={handleCompleteSale}
                >
                    ✓ {getFormattedMessage("pos-pay-now.btn") || "Complete Sale"}
                </button>
            </div>
        </div>
    );
};

export default InlinePaymentPanel;

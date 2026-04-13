import React, { useEffect, useState } from "react";
import { InputGroup, FormControl } from "react-bootstrap-v5";
import { useDispatch } from "react-redux";
import { addToast } from "../../../store/action/toastAction";
import {
    currencySymbolHandling,
    getFormattedMessage,
    getFormattedOptions,
    placeholderText,
} from "../../../shared/sharedMethod";
import { salePaymentStatusOptions, toastType } from "../../../constants";
import ReactSelect from "../../../shared/select/reactSelect";

// Inline styles for react-select inside the gradient payment card
const selectStylesOnGradient = {
    control: (base) => ({
        ...base,
        background: 'rgba(255,255,255,0.18)',
        border: '1px solid rgba(255,255,255,0.35)',
        borderRadius: '10px',
        boxShadow: 'none',
        minHeight: '40px',
        '&:hover': { borderColor: 'rgba(255,255,255,0.6)' },
    }),
    singleValue: (base) => ({ ...base, color: '#fff', fontWeight: 600 }),
    placeholder: (base) => ({ ...base, color: 'rgba(255,255,255,0.6)' }),
    input: (base) => ({ ...base, color: '#fff' }),
    dropdownIndicator: (base) => ({ ...base, color: 'rgba(255,255,255,0.8)', padding: '0 8px' }),
    indicatorSeparator: (base) => ({ ...base, background: 'rgba(255,255,255,0.3)' }),
    menu: (base) => ({
        ...base,
        background: '#fff',
        borderRadius: '10px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        zIndex: 9999,
    }),
    option: (base, state) => ({
        ...base,
        background: state.isSelected ? '#6366f1' : state.isFocused ? '#f0f0ff' : '#fff',
        color: state.isSelected ? '#fff' : '#1a1d29',
        borderRadius: '6px',
        fontSize: '13px',
        cursor: 'pointer',
    }),
    menuList: (base) => ({ ...base, padding: '4px' }),
};

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
        const received = cashPaymentValue.received_amount;
        if (received !== undefined) {
            setSummation(parseFloat(received) - parseFloat(grandTotal));
        } else {
            setSummation(0);
        }
    }, [cashPaymentValue.received_amount, grandTotal]);

    useEffect(() => {
        onChangeReturnChange(summation);
    }, [summation]);

    const paymentStatusFilterOptions = getFormattedOptions(salePaymentStatusOptions);
    const paymentStatusDefaultValue = paymentStatusFilterOptions.map((option) => ({
        value: option.id,
        label: option.name,
    }));

    const handlePay = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!updateProducts || updateProducts.length === 0) {
            dispatch(addToast({
                text: getFormattedMessage("pos.cash-payment.product-error.message"),
                type: toastType.ERROR,
            }));
            return;
        }
        if (
            cashPaymentValue.received_amount !== undefined &&
            parseFloat(cashPaymentValue.received_amount) < parseFloat(grandTotal)
        ) {
            dispatch(addToast({
                text: getFormattedMessage("purchase.less.recieving.ammout.error"),
                type: toastType.ERROR,
            }));
            return;
        }
        onCashPayment(e, true); // true = show print receipt slip after payment
    };

    const tenderAmount = currencySymbolHandling(
        allConfigData, symbol,
        cashPaymentValue.received_amount ? parseFloat(cashPaymentValue.received_amount).toFixed(2) : "0.00"
    );
    const returnAmount = currencySymbolHandling(
        allConfigData, symbol,
        summation ? Math.abs(summation).toFixed(2) : "0.00"
    );

    return (
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
                <label>{getFormattedMessage("dashboard.recentSales.paymentStatus.label")}</label>
                <ReactSelect
                    multiLanguageOption={paymentStatusFilterOptions}
                    onChange={onPaymentStatusChange}
                    name="payment_status"
                    value={cashPaymentValue.payment_status}
                    defaultValue={paymentStatusDefaultValue[1]}
                    placeholder={placeholderText("pos.payment-status.label")}
                    styles={selectStylesOnGradient}
                />
            </div>

            {/* Payment Type — only when paid */}
            {cashPaymentValue?.payment_status?.value === 1 && (
                <div className="mb-3">
                    <label>{getFormattedMessage("select.payment-type.label")}</label>
                    <ReactSelect
                        multiLanguageOption={paymentTypeFilterOptions}
                        onChange={onPaymentTypeChange}
                        name="payment_type"
                        isRequired
                        defaultValue={paymentTypeDefaultValue?.[0]}
                        placeholder={placeholderText("pos.payment-type.label")}
                        styles={selectStylesOnGradient}
                    />
                </div>
            )}

            {/* Received Amount */}
            <div className="mb-3">
                <label>{getFormattedMessage("pos-received-amount.title")}</label>
                <InputGroup>
                    <InputGroup.Text>{symbol || "$"}</InputGroup.Text>
                    <FormControl
                        type="text"
                        name="received_amount"
                        autoComplete="off"
                        placeholder="0.00"
                        onChange={onChangeInput}
                        value={cashPaymentValue.received_amount || ""}
                    />
                </InputGroup>
            </div>

            {/* Notes */}
            <div className="mb-3">
                <label>Note (optional)</label>
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
                onClick={handlePay}
            >
                ✓ {getFormattedMessage("pos-pay-now.btn") || "Complete Sale"}
            </button>
        </div>
    );
};

export default InlinePaymentPanel;

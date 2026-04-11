import React, { useEffect, useState } from "react";
import { Form, InputGroup, FormControl } from "react-bootstrap-v5";
import { useDispatch } from "react-redux";
import { addToast } from "../../../store/action/toastAction";
import {
    currencySymbolHandling,
    getFormattedMessage,
    getFormattedOptions,
    numFloatValidate,
} from "../../../shared/sharedMethod";
import { paymentMethodOptions, salePaymentStatusOptions, toastType } from "../../../constants";
import ReactSelect from "../../../shared/select/reactSelect";

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

    useEffect(() => {
        const received = cashPaymentValue.received_amount;
        if (received !== undefined) {
            setSummation(Number(received) - Number(grandTotal));
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

    const handlePay = (e, print = true) => {
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
            parseInt(cashPaymentValue.received_amount) < parseInt(grandTotal)
        ) {
            dispatch(addToast({
                text: getFormattedMessage("purchase.less.recieving.ammout.error"),
                type: toastType.ERROR,
            }));
            return;
        }
        onCashPayment(e, print);
    };

    const currSymbol = settings.attributes && settings.attributes.currency_symbol;

    return (
        <div className="total-card bg-gradient-brand rounded-4 p-4 mt-2 shadow-sm">
            <div className="text-uppercase small fw-semibold text-white-50 mb-1" style={{ letterSpacing: '1px' }}>Net Payable</div>
            <div className="fs-1 fw-bold mb-3 text-white">
                {currencySymbolHandling(allConfigData, currSymbol, grandTotal || "0.00")}
            </div>

            <div className="d-flex flex-column gap-3 pt-2 border-top border-white border-opacity-25">
                {/* Payment Status Dropdown */}
                <div className="bg-white rounded-3 shadow-sm">
                    <ReactSelect
                        multiLanguageOption={paymentStatusFilterOptions}
                        onChange={onPaymentStatusChange}
                        name="payment_status"
                        title={getFormattedMessage("dashboard.recentSales.paymentStatus.label")}
                        value={cashPaymentValue.payment_status}
                        defaultValue={paymentStatusDefaultValue[1]}
                        placeholder="Payment Status"
                    />
                </div>

                {/* Payment Type Dropdown (Shown only when status is Paid) */}
                {cashPaymentValue?.payment_status?.value === 1 && (
                    <div className="bg-white rounded-3 shadow-sm">
                        <ReactSelect
                            multiLanguageOption={paymentTypeFilterOptions}
                            onChange={onPaymentTypeChange}
                            name="payment_type"
                            isRequired
                            defaultValue={paymentTypeDefaultValue?.[0]}
                            placeholder={getFormattedMessage("select.payment-type.label")}
                        />
                    </div>
                )}

                {/* Received Amount Input */}
                <div>
                     <div className="text-white-50 small mb-1">{getFormattedMessage("pos-received-amount.title")}</div>
                     <InputGroup className="bg-white rounded-3 overflow-hidden shadow-sm">
                         <InputGroup.Text className="bg-transparent border-0 text-muted-custom fw-bold fs-5 px-3">
                             {frontSetting?.value?.currency_symbol || currSymbol}
                         </InputGroup.Text>
                         <FormControl
                             type="text"
                             name="received_amount"
                             autoComplete="off"
                             className="border-0 shadow-none fs-5 fw-bold py-2"
                             defaultValue={grandTotal}
                             onKeyPress={(e) => numFloatValidate(e)}
                             onKeyDown={(e) => {
                                 if (e.key === "Enter") {
                                     handlePay(e, true);
                                 }
                             }}
                             onChange={(e) => onChangeInput(e)}
                             placeholder="0.00"
                         />
                     </InputGroup>
                </div>

                {/* Change Return Label */}
                <div className={`d-flex justify-content-between align-items-center py-2 ${summation < 0 ? 'text-warning' : 'text-white'}`}>
                    <span className="small fw-semibold">
                        <i className="bi bi-arrow-return-left me-2" />
                        {getFormattedMessage("pos.change-return.label")}
                    </span>
                    <span className="fs-5 fw-bold">
                        {currencySymbolHandling(allConfigData, currSymbol, Math.abs(summation).toFixed(2))}
                        {summation < 0 ? <span className="badge bg-warning text-dark ms-2">DUE</span> : ""}
                    </span>
                </div>

                {/* Action Buttons */}
                <div className="d-flex gap-2 mt-2">
                    <button
                        type="button"
                        className="btn btn-light rounded-3 py-2 w-100 fw-bold d-flex align-items-center justify-content-center gap-2 text-dark shadow-sm"
                        onClick={(e) => handlePay(e, true)}
                    >
                        <i className="bi bi-printer-fill text-primary" /> Pay & Print
                    </button>
                    <button
                        type="button"
                        className="btn rounded-3 py-2 w-100 fw-bold d-flex align-items-center justify-content-center gap-2 text-white border-white border-opacity-50 hover-bg-white hover-opacity-10"
                        style={{ border: '1px solid rgba(255,255,255,0.5)', background: 'transparent' }}
                        onClick={(e) => handlePay(e, false)}
                    >
                        <i className="bi bi-check-lg" /> Save Only
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InlinePaymentPanel;

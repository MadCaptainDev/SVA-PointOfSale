import React from "react";
import { Form, InputGroup, FormControl } from "react-bootstrap-v5";
import { Tokens } from '../../../constants/index'
import {
    currencySymbolHandling,
    decimalValidate,
    getFormattedMessage,
    numValidate,
    placeholderText,
} from "../../../shared/sharedMethod";
import { discountType } from "../../../constants";

const CartItemMainCalculation = (props) => {
    const {
        totalQty,
        subTotal,
        cartItemValue,
        onChangeCart,
        grandTotal,
        frontSetting,
        allConfigData,
        onChangeTaxCart,
        selectedOption,
        customer,
    } = props;

    const symbol = frontSetting.value && frontSetting.value.currency_symbol;

    return (
        <div className="calculation">
            {/* Order totals */}
            <div className="summary-row">
                <span>{getFormattedMessage("pos-total-qty.title")}</span>
                <b>{totalQty || "0"}</b>
            </div>
            <div className="summary-row">
                <span>{getFormattedMessage("pos.subtotal.small.title")}</span>
                <b>{currencySymbolHandling(allConfigData, symbol, subTotal ? subTotal : "0.00")}</b>
            </div>
            <div className="summary-divider" />

            {/* Discount */}
            <div className="mb-3">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label className="pos-label mb-0">{getFormattedMessage("globally.detail.discount")}</label>
                    <div style={{ display: "flex", gap: "12px" }}>
                        <Form.Check
                            type="radio"
                            id="fixed"
                            name="discount_type"
                            label={placeholderText("discount-type.filter.fixed.label")}
                            onChange={(e) => onChangeCart(e)}
                            value={discountType.FIXED}
                            checked={cartItemValue.discount_type == discountType.FIXED}
                            style={{ fontSize: "12px" }}
                        />
                        <Form.Check
                            type="radio"
                            id="percentage"
                            name="discount_type"
                            label={placeholderText("discount-type.filter.percentage.label")}
                            onChange={(e) => onChangeCart(e)}
                            value={discountType.PERCENTAGE}
                            checked={cartItemValue.discount_type == discountType.PERCENTAGE}
                            style={{ fontSize: "12px" }}
                        />
                    </div>
                </div>
                <InputGroup>
                    <FormControl
                        type="text"
                        id="discount"
                        className="pos-input"
                        style={{ borderRadius: "10px 0 0 10px !important" }}
                        onChange={(e) => onChangeCart(e)}
                        value={cartItemValue.discount_value === 0 ? "" : cartItemValue.discount_value}
                        onKeyPress={(e) => decimalValidate(e)}
                        name="discount_value"
                        min="0"
                        step=".01"
                        placeholder={placeholderText("purchase.order-item.table.discount.column.label")}
                    />
                    <InputGroup.Text style={{ borderRadius: "0 10px 10px 0", border: "1px solid var(--border-light)", background: "#fafbfc", color: "var(--text-muted)", fontSize: "13px" }}>
                        {cartItemValue.discount_type == discountType.PERCENTAGE ? "%" : symbol}
                    </InputGroup.Text>
                </InputGroup>
            </div>

            {/* Shipping */}
            <div className="mb-3">
                <label className="pos-label">{placeholderText("purchase.input.shipping.label")}</label>
                <InputGroup>
                    <FormControl
                        type="text"
                        id="shipping"
                        name="shipping"
                        min="0"
                        step=".01"
                        className="pos-input"
                        style={{ borderRadius: "10px 0 0 10px !important" }}
                        placeholder={placeholderText("purchase.input.shipping.label")}
                        onChange={(e) => onChangeCart(e)}
                        onKeyPress={(e) => decimalValidate(e)}
                        value={cartItemValue.shipping === 0 ? "" : cartItemValue.shipping}
                    />
                    <InputGroup.Text style={{ borderRadius: "0 10px 10px 0", border: "1px solid var(--border-light)", background: "#fafbfc", color: "var(--text-muted)", fontSize: "13px" }}>
                        {symbol}
                    </InputGroup.Text>
                </InputGroup>
            </div>

            {/* Redeem Points */}
            <div className="mb-3">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                    <label className="pos-label mb-0">{getFormattedMessage("pos.available-points.label")}</label>
                    <b style={{ fontSize: "13px", color: "var(--text-dark)" }}>
                        {customer ? (customer.attributes ? customer.attributes.points : customer.points) : 0}
                    </b>
                </div>
                <FormControl
                    type="text"
                    id="redeem_points"
                    name="redeem_points"
                    min="0"
                    className="pos-input"
                    placeholder={placeholderText("pos.redeem-points.label")}
                    onChange={(e) => onChangeCart(e)}
                    onKeyPress={(e) => numValidate(e)}
                    value={cartItemValue.redeem_points === 0 ? "" : cartItemValue.redeem_points}
                />
            </div>

            <div className="summary-divider" />

            {/* Calculated totals */}
            <div className="summary-row">
                <span>{getFormattedMessage("pos.point-discount.label")}</span>
                <b>{currencySymbolHandling(allConfigData, symbol, cartItemValue.point_discount ? cartItemValue.point_discount : "0.00")}</b>
            </div>
        </div>
    );
};

export default CartItemMainCalculation;

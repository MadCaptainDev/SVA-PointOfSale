import React from "react";
import { useSelector } from "react-redux";
import { Form, InputGroup, FormControl } from "react-bootstrap-v5";
import { Row } from "react-bootstrap";
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
        customer,
    } = props;


    const firstName = localStorage.getItem(Tokens.UPDATED_FIRST_NAME) || '';
    const lastName = localStorage.getItem(Tokens.UPDATED_LAST_NAME) || '';


    return (
        <div className="calculation mt-2">
            <div className="d-flex justify-content-between py-2 text-muted-custom">
                <span>{getFormattedMessage("pos-total-qty.title")}</span>
                <strong className="text-dark">{totalQty ? totalQty : "0"}</strong>
            </div>
            
            <div className="d-flex justify-content-between py-2 text-muted-custom">
                <span>{getFormattedMessage("pos.subtotal.small.title")}</span>
                <strong className="text-dark">
                    {currencySymbolHandling(
                        allConfigData,
                        frontSetting.value && frontSetting.value.currency_symbol,
                        subTotal ? subTotal : "0.00"
                    )}
                </strong>
            </div>

            <hr className="border-line my-2" />

            <div className="d-flex flex-column gap-2 py-2">
                <Form.Group className="mb-1" controlId="discountType">
                    <div className="d-flex justify-content-between align-items-center mb-1 text-muted-custom">
                        <Form.Label className="mb-0">{getFormattedMessage("globally.detail.discount")}</Form.Label>
                        <div className="d-flex gap-2">
                            <Form.Check
                                type="radio"
                                id="fixed"
                                name="discount_type"
                                label={placeholderText("discount-type.filter.fixed.label")}
                                onChange={(e) => onChangeCart(e)}
                                value={discountType.FIXED}
                                checked={cartItemValue.discount_type == discountType.FIXED}
                                inline
                            />
                            <Form.Check
                                type="radio"
                                id="percentage"
                                name="discount_type"
                                label={placeholderText("discount-type.filter.percentage.label")}
                                onChange={(e) => onChangeCart(e)}
                                value={discountType.PERCENTAGE}
                                checked={cartItemValue.discount_type == discountType.PERCENTAGE}
                                inline
                            />
                        </div>
                    </div>
                    <InputGroup>
                        <FormControl
                            type="text"
                            id="discount"
                            className="form-control-modern rounded-3"
                            onChange={(e) => onChangeCart(e)}
                            value={cartItemValue.discount_value === 0 ? "" : cartItemValue.discount_value}
                            onKeyPress={(event) => decimalValidate(event)}
                            name="discount_value"
                            min="0"
                            step=".01"
                            placeholder={placeholderText("purchase.order-item.table.discount.column.label")}
                        />
                        <InputGroup.Text className="bg-white border-line text-muted-custom rounded-end-3">
                            {cartItemValue.discount_type == discountType.PERCENTAGE ? '%' : (frontSetting.value && frontSetting.value.currency_symbol)}
                        </InputGroup.Text>
                    </InputGroup>
                </Form.Group>

                <Form.Group className="mb-1">
                    <InputGroup>
                        <FormControl
                            type="text"
                            id="shipping"
                            name="shipping"
                            className="form-control-modern rounded-3"
                            min="0"
                            step=".01"
                            placeholder={placeholderText("purchase.input.shipping.label")}
                            onChange={(e) => onChangeCart(e)}
                            onKeyPress={(event) => decimalValidate(event)}
                            value={cartItemValue.shipping === 0 ? "" : cartItemValue.shipping}
                        />
                            <InputGroup.Text className="bg-white border-line text-muted-custom rounded-end-3">
                            {frontSetting.value && frontSetting.value.currency_symbol}
                        </InputGroup.Text>
                    </InputGroup>
                </Form.Group>

                <Form.Group className="mb-1">
                    <div className="d-flex justify-content-between mb-1 text-muted-custom small">
                        <span>{getFormattedMessage("pos.available-points.label")}:</span>
                        <span className="fw-bold">{customer ? (customer.attributes ? customer.attributes.points : customer.points) : 0}</span>
                    </div>
                    <InputGroup>
                        <FormControl
                            type="text"
                            id="redeem_points"
                            name="redeem_points"
                            className="form-control-modern rounded-3"
                            min="0"
                            placeholder={placeholderText("pos.redeem-points.label")}
                            onChange={(e) => onChangeCart(e)}
                            onKeyPress={(event) => numValidate(event)}
                            value={cartItemValue.redeem_points === 0 ? "" : cartItemValue.redeem_points}
                        />
                    </InputGroup>
                </Form.Group>
            </div>

            <div className="d-flex justify-content-between py-2 text-muted-custom">
                <span>{getFormattedMessage("pos.point-discount.label")}</span>
                <strong className="text-dark">
                    {currencySymbolHandling(
                        allConfigData,
                        frontSetting.value && frontSetting.value.currency_symbol,
                        cartItemValue.point_discount ? cartItemValue.point_discount : "0.00"
                    )}
                </strong>
            </div>
            
            <hr className="border-line my-2" />
        </div>
    );
};
export default CartItemMainCalculation;

import React, { useState } from "react";
import Form from "react-bootstrap/Form";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
    getFormattedMessage,
    placeholderText,
    numValidate,
} from "../../shared/sharedMethod";
import { editCustomer } from "../../store/action/customerAction";
import ModelFooter from "../../shared/components/modelFooter";

const CustomerForm = (props) => {
    const { addCustomerData, id, editCustomer, singleCustomer } = props;
    const navigate = useNavigate();

    const [customerValue, setCustomerValue] = useState({
        name: singleCustomer ? singleCustomer[0].name : "",
        phone: singleCustomer ? singleCustomer[0].phone : "",
        address: singleCustomer ? singleCustomer[0].address : "",
        // dob: singleCustomer ? (singleCustomer[0].dob ? moment(singleCustomer[0].dob).toDate() : null) : null,
        // email: singleCustomer ? singleCustomer[0].email : "",
        // country: singleCustomer ? singleCustomer[0].country : "",
        // city: singleCustomer ? singleCustomer[0].city : "",
    });

    const [errors, setErrors] = useState({
        name: "",
        phone: "",
        address: "",
        // dob: "",
        // email: "",
        // country: "",
        // city: "",
    });

    const disabled =
        singleCustomer &&
        singleCustomer[0].name === customerValue.name &&
        singleCustomer[0].phone === customerValue.phone &&
        singleCustomer[0].address === customerValue.address;

    const handleValidation = () => {
        let errorss = {};
        let isValid = false;

        if (!customerValue["name"]) {
            errorss["name"] = getFormattedMessage("globally.input.name.validate.label");
        } else if (!customerValue["phone"]) {
            errorss["phone"] = getFormattedMessage("globally.input.phone-number.validate.label");
        } else if (!customerValue["address"]) {
            errorss["address"] = getFormattedMessage("globally.input.address.validate.label");
        } else {
            isValid = true;
        }
        setErrors(errorss);
        return isValid;
    };

    const onChangeInput = (e) => {
        e.preventDefault();
        setCustomerValue((inputs) => ({
            ...inputs,
            [e.target.name]: e.target.value,
        }));
        setErrors("");
    };

    const onSubmit = (event) => {
        event.preventDefault();
        const valid = handleValidation();
        if (singleCustomer && valid) {
            if (!disabled) {
                setCustomerValue(customerValue);
                editCustomer(id, customerValue, navigate);
            }
        } else {
            if (valid) {
                setCustomerValue(customerValue);
                addCustomerData(customerValue);
            }
        }
    };

    return (
        <div className="card">
            <div className="card-body">
                <Form>
                    <div className="row">
                        {/* Name */}
                        <div className="col-md-6 mb-3">
                            <label className="form-label">
                                {getFormattedMessage("globally.input.name.label")}:
                            </label>
                            <span className="required" />
                            <input
                                type="text"
                                name="name"
                                value={customerValue.name}
                                placeholder={placeholderText("globally.input.name.placeholder.label")}
                                className="form-control"
                                autoFocus={true}
                                onChange={(e) => onChangeInput(e)}
                            />
                            <span className="text-danger d-block fw-400 fs-small mt-2">
                                {errors["name"] ? errors["name"] : null}
                            </span>
                        </div>

                        {/* Phone */}
                        <div className="col-md-6 mb-3">
                            <label className="form-label">
                                {getFormattedMessage("globally.input.phone-number.label")}:
                            </label>
                            <span className="required" />
                            <input
                                type="text"
                                name="phone"
                                className="form-control"
                                pattern="[0-9]*"
                                placeholder={placeholderText("globally.input.phone-number.placeholder.label")}
                                onKeyPress={(event) => numValidate(event)}
                                onChange={(e) => onChangeInput(e)}
                                value={customerValue.phone}
                            />
                            <span className="text-danger d-block fw-400 fs-small mt-2">
                                {errors["phone"] ? errors["phone"] : null}
                            </span>
                        </div>

                        {/* Address */}
                        <div className="col-md-12 mb-3">
                            <label className="form-label">
                                {getFormattedMessage("globally.input.address.label")}:
                            </label>
                            <span className="required" />
                            <textarea
                                type="text"
                                rows="4"
                                cols="50"
                                name="address"
                                className="form-control"
                                placeholder={placeholderText("globally.input.address.placeholder.label")}
                                onChange={(e) => onChangeInput(e)}
                                value={customerValue.address}
                            />
                            <span className="text-danger d-block fw-400 fs-small mt-2">
                                {errors["address"] ? errors["address"] : null}
                            </span>
                        </div>

                        <ModelFooter
                            onEditRecord={singleCustomer}
                            onSubmit={onSubmit}
                            editDisabled={disabled}
                            addDisabled={!customerValue.name}
                            link="/app/customers"
                        />
                    </div>
                </Form>
            </div>
        </div>
    );
};

export default connect(null, { editCustomer })(CustomerForm);

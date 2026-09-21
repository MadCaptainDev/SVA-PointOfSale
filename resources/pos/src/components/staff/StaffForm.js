import React, { useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import { connect, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import * as EmailValidator from "email-validator";
import { editStaff } from "../../store/action/staffAction";
import ImagePicker from "../../shared/image-picker/ImagePicker";
import {
    getAvatarName,
    getFormattedMessage,
    placeholderText,
    numValidate,
} from "../../shared/sharedMethod";
import userAvatar from "../../assets/images/avatar.png";
import ModelFooter from "../../shared/components/modelFooter";
import ReactSelect from "../../shared/select/reactSelect";
import { fetchAllRoles } from "../../store/action/roleAction";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const StaffForm = (props) => {
    const {
        addStaffData,
        id,
        singleStaff,
        isEdit,
        isCreate,
        fetchAllRoles,
        roles,
    } = props;
    const Dispatch = useDispatch();
    const navigate = useNavigate();

    const [staffValue, setStaffValue] = useState({
        first_name: singleStaff ? singleStaff[0].first_name : "",
        last_name: singleStaff ? singleStaff[0].last_name : "",
        email: singleStaff ? singleStaff[0].email : "",
        phone: singleStaff ? singleStaff[0].phone : "",
        password: "",
        confirm_password: "",
        role_id: singleStaff ? singleStaff[0].role_id : "",
        image: singleStaff ? singleStaff[0].image : "",
        employee_code: singleStaff ? singleStaff[0].employee_code : "",
        job_title: singleStaff ? singleStaff[0].job_title : "",
        department: singleStaff ? singleStaff[0].department : "",
        joined_at: singleStaff ? singleStaff[0].joined_at : "",
        base_salary: singleStaff ? singleStaff[0].base_salary : "",
        commission_rate: singleStaff ? singleStaff[0].commission_rate : "",
        notes: singleStaff ? singleStaff[0].notes : "",
    });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState({
        new: false,
        confirm: false,
    });

    const avatarName = getAvatarName(
        singleStaff &&
            singleStaff[0].image === "" &&
            singleStaff[0].first_name &&
            singleStaff[0].last_name &&
            singleStaff[0].first_name + " " + singleStaff[0].last_name
    );
    const newImg =
        singleStaff &&
        singleStaff[0].image &&
        singleStaff[0].image === null &&
        avatarName;
    const [imagePreviewUrl, setImagePreviewUrl] = useState(newImg && newImg);
    const [selectImg, setSelectImg] = useState(null);

    const [selectedRole] = useState(
        singleStaff && singleStaff[0]
            ? [
                  {
                      label: singleStaff[0].role_id.label[0],
                      value: singleStaff[0].role_id.value[0],
                  },
              ]
            : null
    );

    useEffect(() => {
        fetchAllRoles();
        setImagePreviewUrl(
            singleStaff
                ? singleStaff[0].image && singleStaff[0].image
                : userAvatar
        );
    }, []);

    const onRolesChange = (obj) => {
        setStaffValue((value) => ({ ...value, role_id: obj }));
        setErrors("");
    };

    const handleValidation = () => {
        let errorss = {};
        let isValid = false;
        if (!staffValue["first_name"]) {
            errorss["first_name"] = getFormattedMessage(
                "user.input.first-name.validate.label"
            );
        } else if (!staffValue["last_name"]) {
            errorss["last_name"] = getFormattedMessage(
                "user.input.last-name.validate.label"
            );
        } else if (!EmailValidator.validate(staffValue["email"])) {
            if (!staffValue["email"]) {
                errorss["email"] = getFormattedMessage(
                    "user.input.email.validate.label"
                );
            } else {
                errorss["email"] = getFormattedMessage(
                    "user.input.email.valid.validate.label"
                );
            }
        } else if (!staffValue["phone"]) {
            errorss["phone"] = getFormattedMessage(
                "user.input.phone-number.validate.label"
            );
        } else if (!staffValue["role_id"]) {
            errorss["role_id"] = getFormattedMessage(
                "user.input.role.validate.label"
            );
        } else if (!isEdit && !staffValue["password"]) {
            errorss["password"] = getFormattedMessage(
                "user.input.password.validate.label"
            );
        } else if (
            !isEdit &&
            staffValue["password"] !== staffValue["confirm_password"]
        ) {
            errorss["confirm_password"] = getFormattedMessage(
                "user.input.confirm-password.validate.label"
            );
        } else {
            isValid = true;
        }
        setErrors(errorss);
        return isValid;
    };

    const onChangeInput = (e) => {
        e.preventDefault();
        setStaffValue((inputs) => ({
            ...inputs,
            [e.target.name]: e.target.value,
        }));
        setErrors("");
    };

    const handleImageChanges = (e) => {
        e.preventDefault();
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            if (file.type === "image/jpeg" || file.type === "image/png") {
                setSelectImg(file);
                const fileReader = new FileReader();
                fileReader.onloadend = () => {
                    setImagePreviewUrl(fileReader.result);
                };
                fileReader.readAsDataURL(file);
                setErrors("");
            }
        }
    };

    const prepareFormData = (data) => {
        const formData = new FormData();
        formData.append("first_name", data.first_name);
        formData.append("last_name", data.last_name);
        formData.append("email", data.email);
        formData.append("phone", data.phone);
        if (!isEdit || data.password) {
            formData.append("password", data.password);
            formData.append("confirm_password", data.confirm_password);
        }
        if (data.role_id.value) {
            formData.append("role_id", data.role_id.value);
        } else {
            formData.append("role_id", data.role_id);
        }
        if (data.employee_code) {
            formData.append("employee_code", data.employee_code);
        }
        if (data.job_title) {
            formData.append("job_title", data.job_title);
        }
        if (data.department) {
            formData.append("department", data.department);
        }
        if (data.joined_at) {
            formData.append("joined_at", data.joined_at);
        }
        if (data.base_salary !== "" && data.base_salary !== null) {
            formData.append("base_salary", data.base_salary);
        }
        if (data.commission_rate !== "" && data.commission_rate !== null) {
            formData.append("commission_rate", data.commission_rate);
        }
        if (data.notes) {
            formData.append("notes", data.notes);
        }
        if (selectImg) {
            formData.append("image", data.image);
        }
        return formData;
    };

    const onSubmit = (event) => {
        event.preventDefault();
        staffValue.image = selectImg;
        const valid = handleValidation();
        if (singleStaff && valid) {
            staffValue.image = selectImg;
            Dispatch(editStaff(id, prepareFormData(staffValue), navigate));
        } else if (valid) {
            addStaffData(prepareFormData(staffValue));
        }
    };

    const handleHideShowPassword = (type) => {
        if (type === "new") {
            setShowPassword({ ...showPassword, new: !showPassword.new });
        } else if (type === "confirm") {
            setShowPassword({
                ...showPassword,
                confirm: !showPassword.confirm,
            });
        }
    };

    return (
        <div className="card">
            <div className="card-body">
                <Form>
                    <div className="row">
                        <div className="mb-4">
                            <ImagePicker
                                user={userAvatar}
                                isCreate={isCreate}
                                avtarName={avatarName}
                                imageTitle={placeholderText(
                                    "globally.input.change-image.tooltip"
                                )}
                                imagePreviewUrl={imagePreviewUrl}
                                handleImageChange={handleImageChanges}
                            />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label">
                                {getFormattedMessage(
                                    "user.input.first-name.label"
                                )}{" "}
                                :<span className="required" />
                            </label>
                            <input
                                type="text"
                                name="first_name"
                                value={staffValue.first_name}
                                placeholder={placeholderText(
                                    "user.input.first-name.placeholder.label"
                                )}
                                className="form-control"
                                autoFocus={true}
                                onChange={(e) => onChangeInput(e)}
                            />
                            <span className="text-danger d-block fw-400 fs-small mt-2">
                                {errors["first_name"] || null}
                            </span>
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label">
                                {getFormattedMessage(
                                    "user.input.last-name.label"
                                )}
                                :<span className="required" />
                            </label>
                            <input
                                type="text"
                                name="last_name"
                                className="form-control"
                                placeholder={placeholderText(
                                    "user.input.last-name.placeholder.label"
                                )}
                                onChange={(e) => onChangeInput(e)}
                                value={staffValue.last_name}
                            />
                            <span className="text-danger d-block fw-400 fs-small mt-2">
                                {errors["last_name"] || null}
                            </span>
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label">
                                {getFormattedMessage("user.input.email.label")}:
                                <span className="required" />
                            </label>
                            <input
                                type="text"
                                name="email"
                                className="form-control"
                                placeholder={placeholderText(
                                    "user.input.email.placeholder.label"
                                )}
                                onChange={(e) => onChangeInput(e)}
                                value={staffValue.email}
                            />
                            <span className="text-danger d-block fw-400 fs-small mt-2">
                                {errors["email"] || null}
                            </span>
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label">
                                {getFormattedMessage(
                                    "user.input.phone-number.label"
                                )}
                                :<span className="required" />
                            </label>
                            <input
                                type="text"
                                name="phone"
                                className="form-control"
                                placeholder={placeholderText(
                                    "user.input.phone-number.placeholder.label"
                                )}
                                onKeyPress={(event) => numValidate(event)}
                                onChange={(e) => onChangeInput(e)}
                                value={staffValue.phone}
                            />
                            <span className="text-danger d-block fw-400 fs-small mt-2">
                                {errors["phone"] || null}
                            </span>
                        </div>
                        <div className="col-md-6 mb-3">
                            <ReactSelect
                                multiLanguageOption={roles}
                                onChange={onRolesChange}
                                name="role_id"
                                title={getFormattedMessage(
                                    "user.input.role.label"
                                )}
                                errors={errors["role_id"]}
                                defaultValue={selectedRole}
                                placeholder={placeholderText(
                                    "user.input.role.placeholder.label"
                                )}
                            />
                        </div>
                        {!isEdit ? (
                            <>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">
                                        {getFormattedMessage(
                                            "user.input.password.label"
                                        )}
                                        :<span className="required" />
                                    </label>
                                    <div className="input-group">
                                        <input
                                            type={
                                                showPassword.new
                                                    ? "text"
                                                    : "password"
                                            }
                                            name="password"
                                            className="form-control"
                                            placeholder={placeholderText(
                                                "user.input.password.placeholder.label"
                                            )}
                                            onChange={(e) => onChangeInput(e)}
                                            value={staffValue.password}
                                        />
                                        <span
                                            className="input-group-text cursor-pointer"
                                            onClick={() =>
                                                handleHideShowPassword("new")
                                            }
                                        >
                                            <FontAwesomeIcon
                                                icon={
                                                    showPassword.new
                                                        ? faEye
                                                        : faEyeSlash
                                                }
                                            />
                                        </span>
                                    </div>
                                    <span className="text-danger d-block fw-400 fs-small mt-2">
                                        {errors["password"] || null}
                                    </span>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">
                                        {getFormattedMessage(
                                            "user.input.confirm-password.label"
                                        )}
                                        :<span className="required" />
                                    </label>
                                    <div className="input-group">
                                        <input
                                            type={
                                                showPassword.confirm
                                                    ? "text"
                                                    : "password"
                                            }
                                            name="confirm_password"
                                            className="form-control"
                                            placeholder={placeholderText(
                                                "user.input.confirm-password.placeholder.label"
                                            )}
                                            onChange={(e) => onChangeInput(e)}
                                            value={staffValue.confirm_password}
                                        />
                                        <span
                                            className="input-group-text cursor-pointer"
                                            onClick={() =>
                                                handleHideShowPassword(
                                                    "confirm"
                                                )
                                            }
                                        >
                                            <FontAwesomeIcon
                                                icon={
                                                    showPassword.confirm
                                                        ? faEye
                                                        : faEyeSlash
                                                }
                                            />
                                        </span>
                                    </div>
                                    <span className="text-danger d-block fw-400 fs-small mt-2">
                                        {errors["confirm_password"] || null}
                                    </span>
                                </div>
                            </>
                        ) : null}
                        <div className="col-md-6 mb-3">
                            <label className="form-label">
                                {getFormattedMessage(
                                    "staff.input.employee-code.label"
                                )}
                                :
                            </label>
                            <input
                                type="text"
                                name="employee_code"
                                className="form-control"
                                placeholder={placeholderText(
                                    "staff.input.employee-code.placeholder"
                                )}
                                onChange={(e) => onChangeInput(e)}
                                value={staffValue.employee_code}
                            />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label">
                                {getFormattedMessage(
                                    "staff.input.job-title.label"
                                )}
                                :
                            </label>
                            <input
                                type="text"
                                name="job_title"
                                className="form-control"
                                placeholder={placeholderText(
                                    "staff.input.job-title.placeholder"
                                )}
                                onChange={(e) => onChangeInput(e)}
                                value={staffValue.job_title}
                            />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label">
                                {getFormattedMessage(
                                    "staff.input.department.label"
                                )}
                                :
                            </label>
                            <input
                                type="text"
                                name="department"
                                className="form-control"
                                placeholder={placeholderText(
                                    "staff.input.department.placeholder"
                                )}
                                onChange={(e) => onChangeInput(e)}
                                value={staffValue.department}
                            />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label">
                                {getFormattedMessage(
                                    "staff.input.joined-at.label"
                                )}
                                :
                            </label>
                            <input
                                type="date"
                                name="joined_at"
                                className="form-control"
                                onChange={(e) => onChangeInput(e)}
                                value={staffValue.joined_at}
                            />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label">
                                {getFormattedMessage(
                                    "staff.input.base-salary.label"
                                )}
                                :
                            </label>
                            <input
                                type="number"
                                name="base_salary"
                                className="form-control"
                                placeholder={placeholderText(
                                    "staff.input.base-salary.placeholder"
                                )}
                                onChange={(e) => onChangeInput(e)}
                                value={staffValue.base_salary}
                            />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label">
                                {getFormattedMessage(
                                    "staff.input.commission-rate.label"
                                )}
                                :
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                name="commission_rate"
                                className="form-control"
                                placeholder={placeholderText(
                                    "staff.input.commission-rate.placeholder"
                                )}
                                onChange={(e) => onChangeInput(e)}
                                value={staffValue.commission_rate}
                            />
                            <small className="text-muted">
                                {getFormattedMessage(
                                    "staff.input.commission-rate.help"
                                )}
                            </small>
                        </div>
                        <div className="col-md-12 mb-3">
                            <label className="form-label">
                                {getFormattedMessage("staff.input.notes.label")}
                                :
                            </label>
                            <textarea
                                name="notes"
                                className="form-control"
                                rows="3"
                                placeholder={placeholderText(
                                    "staff.input.notes.placeholder"
                                )}
                                onChange={(e) => onChangeInput(e)}
                                value={staffValue.notes}
                            />
                        </div>
                        <ModelFooter
                            onEditRecord={singleStaff}
                            onSubmit={onSubmit}
                            editTo={"/app/staff"}
                            addDisabled={!staffValue.first_name}
                            link="/app/staff"
                        />
                    </div>
                </Form>
            </div>
        </div>
    );
};

const mapStateToProps = (state) => {
    const { roles } = state;
    return { roles };
};

export default connect(mapStateToProps, { fetchAllRoles })(StaffForm);

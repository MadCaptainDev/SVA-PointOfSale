import React from "react";
import { connect } from "react-redux";
import StaffForm from "./StaffForm";
import { addStaff } from "../../store/action/staffAction";
import MasterLayout from "../MasterLayout";
import HeaderTitle from "../header/HeaderTitle";
import { useNavigate } from "react-router-dom";
import { getFormattedMessage } from "../../shared/sharedMethod";

const CreateStaff = (props) => {
    const { addStaff } = props;
    const navigate = useNavigate();
    const addStaffData = (formValue) => {
        addStaff(formValue, navigate);
    };

    return (
        <MasterLayout>
            <HeaderTitle
                title={getFormattedMessage("staff.create.title")}
                to="/app/staff"
            />
            <StaffForm addStaffData={addStaffData} />
        </MasterLayout>
    );
};

export default connect(null, { addStaff })(CreateStaff);

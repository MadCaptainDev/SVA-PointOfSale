import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import StaffForm from "./StaffForm";
import { fetchStaffMember } from "../../store/action/staffAction";
import { useParams } from "react-router-dom";
import MasterLayout from "../MasterLayout";
import HeaderTitle from "../header/HeaderTitle";
import { getFormattedMessage } from "../../shared/sharedMethod";
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";

const EditStaff = (props) => {
    const { fetchStaffMember, staff } = props;
    const { id } = useParams();
    const [isEdit, setIsEdit] = useState(false);

    useEffect(() => {
        fetchStaffMember(id);
        setIsEdit(true);
    }, []);

    const itemsValue =
        staff &&
        staff.length === 1 &&
        staff.map((member) => ({
            image: member.attributes.image,
            first_name: member.attributes.first_name,
            last_name: member.attributes.last_name,
            email: member.attributes.email,
            phone: member.attributes.phone,
            role_id: {
                value: (member.attributes.role || []).map((ro) => ro.id),
                label: (member.attributes.role || []).map((ro) => ro.name),
            },
            employee_code: member.attributes.employee_code || "",
            job_title: member.attributes.job_title || "",
            department: member.attributes.department || "",
            joined_at: member.attributes.joined_at
                ? member.attributes.joined_at.substring(0, 10)
                : "",
            base_salary: member.attributes.base_salary || "",
            commission_rate:
                member.attributes.commission_rate !== null &&
                member.attributes.commission_rate !== undefined
                    ? member.attributes.commission_rate
                    : "",
            notes: member.attributes.notes || "",
            id: member.id,
        }));

    return (
        <MasterLayout>
            <TopProgressBar />
            <HeaderTitle
                title={getFormattedMessage("staff.edit.title")}
                to="/app/staff"
            />
            {staff.length === 1 && (
                <StaffForm singleStaff={itemsValue} id={id} isEdit={isEdit} />
            )}
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { staff } = state;
    return { staff };
};

export default connect(mapStateToProps, { fetchStaffMember })(EditStaff);

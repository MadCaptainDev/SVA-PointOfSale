import React, { useState } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import moment from "moment";
import MasterLayout from "../MasterLayout";
import ReactDataTable from "../../shared/table/ReactDataTable";
import { fetchStaff } from "../../store/action/staffAction";
import DeleteStaff from "./DeleteStaff";
import TabTitle from "../../shared/tab-title/TabTitle";
import {
    getAvatarName,
    getFormattedDate,
    getFormattedMessage,
    placeholderText,
} from "../../shared/sharedMethod";
import ActionButton from "../../shared/action-buttons/ActionButton";
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";

const Staff = (props) => {
    const { staff, fetchStaff, totalRecord, isLoading, allConfigData } = props;
    const [deleteModel, setDeleteModel] = useState(false);
    const [isDelete, setIsDelete] = useState(null);

    const onClickDeleteModel = (isDelete = null) => {
        setDeleteModel(!deleteModel);
        setIsDelete(isDelete);
    };

    const itemsValue =
        staff.length >= 0 &&
        staff.map((member) => ({
            date: getFormattedDate(
                member.attributes.created_at,
                allConfigData && allConfigData
            ),
            time: moment(member.attributes.created_at).format("LT"),
            image: member.attributes.image,
            first_name: member.attributes.first_name,
            last_name: member.attributes.last_name,
            email: member.attributes.email,
            phone: member.attributes.phone,
            employee_code: member.attributes.employee_code,
            job_title: member.attributes.job_title,
            department: member.attributes.department,
            commission_rate: member.attributes.commission_rate,
            id: member.id,
        }));

    const onChange = (filter) => {
        fetchStaff(filter, true);
    };

    const goToEdit = (item) => {
        window.location.href = "#/app/staff/edit/" + item.id;
    };

    const columns = [
        {
            name: getFormattedMessage("staff.table.staff.column.title"),
            selector: (row) => row.first_name,
            sortField: "first_name",
            sortable: true,
            cell: (row) => {
                const imageUrl = row.image ? row.image : null;
                const lastName = row.last_name ? row.last_name : "";
                return (
                    <div className="d-flex align-items-center">
                        <div className="me-2">
                            <Link to={`/app/staff/detail/${row.id}`}>
                                {imageUrl ? (
                                    <img
                                        src={imageUrl}
                                        height="50"
                                        width="50"
                                        alt="Staff"
                                        className="image image-circle image-mini"
                                    />
                                ) : (
                                    <span className="custom-user-avatar fs-5">
                                        {getAvatarName(
                                            row.first_name + " " + row.last_name
                                        )}
                                    </span>
                                )}
                            </Link>
                        </div>
                        <div className="d-flex flex-column">
                            <Link
                                to={`/app/staff/detail/${row.id}`}
                                className="text-decoration-none"
                            >
                                {row.first_name + " " + lastName}
                            </Link>
                            <span>{row.email}</span>
                        </div>
                    </div>
                );
            },
        },
        {
            name: getFormattedMessage("staff.input.employee-code.label"),
            selector: (row) => row.employee_code,
            sortField: "employee_code",
            sortable: true,
        },
        {
            name: getFormattedMessage("staff.input.job-title.label"),
            selector: (row) => row.job_title,
            sortField: "job_title",
            sortable: true,
        },
        {
            name: getFormattedMessage("staff.input.department.label"),
            selector: (row) => row.department,
            sortField: "department",
            sortable: true,
        },
        {
            name: getFormattedMessage("staff.input.commission-rate.label"),
            selector: (row) => row.commission_rate,
            sortField: "commission_rate",
            sortable: true,
            cell: (row) =>
                row.commission_rate !== null && row.commission_rate !== ""
                    ? `${row.commission_rate}%`
                    : getFormattedMessage("staff.commission.default.label"),
        },
        {
            name: getFormattedMessage(
                "globally.react-table.column.created-date.label"
            ),
            selector: (row) => row.date,
            sortField: "created_at",
            sortable: true,
            cell: (row) => (
                <span className="badge bg-light-info">
                    <div className="mb-1">{row.time}</div>
                    <div>{row.date}</div>
                </span>
            ),
        },
        {
            name: getFormattedMessage("react-data-table.action.column.label"),
            right: true,
            ignoreRowClick: true,
            allowOverflow: true,
            button: true,
            cell: (row) => (
                <ActionButton
                    item={row}
                    goToEditProduct={goToEdit}
                    isEditMode={true}
                    onClickDeleteModel={onClickDeleteModel}
                />
            ),
        },
    ];

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={placeholderText("staff.title")} />
            <ReactDataTable
                columns={columns}
                items={itemsValue}
                onChange={onChange}
                ButtonValue={getFormattedMessage("staff.create.title")}
                to="#/app/staff/create"
                totalRows={totalRecord}
                isLoading={isLoading}
            />
            <DeleteStaff
                onClickDeleteModel={onClickDeleteModel}
                deleteModel={deleteModel}
                onDelete={isDelete}
            />
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { staff, totalRecord, isLoading, allConfigData } = state;
    return { staff, totalRecord, isLoading, allConfigData };
};

export default connect(mapStateToProps, { fetchStaff })(Staff);

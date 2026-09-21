import React from "react";
import { connect } from "react-redux";
import moment from "moment";
import { fetchStaffIncentiveEarnings } from "../../store/action/staffIncentiveAction";
import ReactDataTable from "../../shared/table/ReactDataTable";
import {
    getFormattedDate,
    getFormattedMessage,
} from "../../shared/sharedMethod";

const StaffIncentiveEarnings = (props) => {
    const {
        fetchStaffIncentiveEarnings,
        staffIncentiveEarnings,
        totalRecord,
        isLoading,
        allConfigData,
    } = props;

    const onChange = (filter) => {
        fetchStaffIncentiveEarnings(filter, true);
    };

    const itemsValue =
        staffIncentiveEarnings.length >= 0 &&
        staffIncentiveEarnings.map((earning) => ({
            date: getFormattedDate(
                earning.attributes.created_at,
                allConfigData && allConfigData
            ),
            time: moment(earning.attributes.created_at).format("LT"),
            staff_name: earning.attributes.staff_name,
            sale_reference: earning.attributes.sale_reference,
            sale_amount: earning.attributes.sale_amount,
            commission_rate: earning.attributes.commission_rate,
            amount: earning.attributes.amount,
            status: earning.attributes.status,
            id: earning.id,
        }));

    const statusBadge = (status) => {
        const map = {
            pending: "bg-light-warning",
            paid: "bg-light-success",
            cancelled: "bg-light-danger",
        };
        return (
            <span className={`badge ${map[status] || "bg-light-info"}`}>
                {getFormattedMessage(
                    `staff-incentive.status.${status}.label`
                ) || status}
            </span>
        );
    };

    const currency = (amount) =>
        `${
            allConfigData && allConfigData.hasOwnProperty("currency_symbol")
                ? allConfigData.currency_symbol
                : ""
        } ${amount}`;

    const columns = [
        {
            name: getFormattedMessage("staff.table.staff.column.title"),
            selector: (row) => row.staff_name,
            sortField: "user_id",
            sortable: true,
        },
        {
            name: getFormattedMessage(
                "customer-withdrawal.table.reference.column.title"
            ),
            selector: (row) => row.sale_reference,
            sortField: "sale_id",
            sortable: true,
        },
        {
            name: getFormattedMessage(
                "staff-incentive.table.sale-amount.column.title"
            ),
            selector: (row) => row.sale_amount,
            sortField: "sale_amount",
            sortable: true,
            cell: (row) => currency(row.sale_amount),
        },
        {
            name: getFormattedMessage("staff.input.commission-rate.label"),
            selector: (row) => row.commission_rate,
            sortField: "commission_rate",
            sortable: true,
            cell: (row) => `${row.commission_rate}%`,
        },
        {
            name: getFormattedMessage(
                "staff-incentive.table.earned.column.title"
            ),
            selector: (row) => row.amount,
            sortField: "amount",
            sortable: true,
            cell: (row) => currency(row.amount),
        },
        {
            name: getFormattedMessage(
                "staff-incentive.table.status.column.title"
            ),
            selector: (row) => row.status,
            sortField: "status",
            sortable: true,
            cell: (row) => statusBadge(row.status),
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
                    {row.date}
                </span>
            ),
        },
    ];

    return (
        <ReactDataTable
            columns={columns}
            items={itemsValue}
            onChange={onChange}
            isLoading={isLoading}
            totalRows={totalRecord}
        />
    );
};

const mapStateToProps = (state) => {
    const {
        staffIncentiveEarnings,
        totalRecord,
        isLoading,
        allConfigData,
    } = state;
    return {
        staffIncentiveEarnings,
        totalRecord,
        isLoading,
        allConfigData,
    };
};

export default connect(mapStateToProps, { fetchStaffIncentiveEarnings })(
    StaffIncentiveEarnings
);

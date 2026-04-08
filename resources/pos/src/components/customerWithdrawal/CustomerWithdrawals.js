import React, { useState } from "react";
import { connect } from "react-redux";
import moment from "moment";
import MasterLayout from "../MasterLayout";
import { fetchCustomerWithdrawals } from "../../store/action/customerWithdrawalAction";
import ReactDataTable from "../../shared/table/ReactDataTable";
import TabTitle from "../../shared/tab-title/TabTitle";
import {
    getFormattedDate,
    getFormattedMessage,
    placeholderText,
} from "../../shared/sharedMethod";
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";

const CustomerWithdrawals = (props) => {
    const { fetchCustomerWithdrawals, customerWithdrawals, totalRecord, isLoading, allConfigData } =
        props;

    const onChange = (filter) => {
        fetchCustomerWithdrawals(filter, true);
    };

    const itemsValue =
        customerWithdrawals.length >= 0 &&
        customerWithdrawals.map((withdrawal) => ({
            date: getFormattedDate(
                withdrawal.attributes.date,
                allConfigData && allConfigData
            ),
            time: moment(withdrawal.attributes.created_at).format("LT"),
            customer_name: withdrawal.attributes.customer_name,
            points: withdrawal.attributes.points,
            amount: withdrawal.attributes.amount,
            reference_code: withdrawal.attributes.reference_code,
            id: withdrawal.id,
        }));

    const columns = [
        {
            name: getFormattedMessage("customer.title"),
            selector: (row) => row.customer_name,
            sortField: "customer_name",
            sortable: true,
        },
        {
            name: getFormattedMessage("customer-withdrawal.table.points.column.title"),
            selector: (row) => row.points,
            sortField: "points",
            sortable: true,
        },
        {
            name: getFormattedMessage("customer-withdrawal.table.amount.column.title"),
            selector: (row) => row.amount,
            sortField: "amount",
            sortable: true,
            cell: (row) => {
                return (
                    <span>
                        {allConfigData && allConfigData.hasOwnProperty('currency_symbol') ? allConfigData.currency_symbol : ''} {row.amount}
                    </span>
                );
            },
        },
        {
            name: getFormattedMessage("customer-withdrawal.table.reference.column.title"),
            selector: (row) => row.reference_code,
            sortField: "reference_code",
            sortable: true,
        },
        {
            name: getFormattedMessage(
                "globally.react-table.column.created-date.label"
            ),
            selector: (row) => row.date,
            sortField: "date",
            sortable: true,
            cell: (row) => {
                return (
                    <span className="badge bg-light-info">
                        <div className="mb-1">{row.time}</div>
                        {row.date}
                    </span>
                );
            },
        },
    ];

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={placeholderText("customer-withdrawals.title")} />
            <ReactDataTable
                columns={columns}
                items={itemsValue}
                onChange={onChange}
                isLoading={isLoading}
                totalRows={totalRecord}
            />
        </MasterLayout>
    );
};

const mapStateToProps = (state) => {
    const { customerWithdrawals, totalRecord, isLoading, allConfigData } = state;
    return { customerWithdrawals, totalRecord, isLoading, allConfigData };
};

export default connect(mapStateToProps, { fetchCustomerWithdrawals })(CustomerWithdrawals);

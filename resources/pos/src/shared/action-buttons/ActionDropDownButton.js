import React from 'react';
import {Dropdown} from 'react-bootstrap';
import {getFormattedMessage} from '../sharedMethod';
import {
    faEye, faFilePdf, faDollarSign, faTrash, faCartShopping,
    faPenToSquare, faEllipsisVertical, faBarcode
} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import { Permissions } from '../../constants';
import { useSelector } from 'react-redux';

const ActionDropDownButton = (props) => {
    const {
        goToEditProduct,
        item,
        reference_code, // <-- reference code passed from parent
        onClickDeleteModel = true,
        goToDetailScreen,
        isViewIcon = false,
        isPdfIcon = false,
        isCreateSaleReturn,
        onCreateSaleReturnClick,
        isCreatePayment = false,
        onPdfClick,
        title,
        isPaymentShow = false,
        onShowPaymentClick,
        onCreatePaymentClick,
        onCreateSaleClick,
        isCreatesSales
    } = props;

    const {config} = useSelector(state => state);

    // Handle barcode print
    const handleBarcodePrint = (refCode) => {
        if (!refCode) {
            console.error("Reference code not provided!");
            return;
        }
        const url = `https://pos.svasilksandreadymades.com/api/export-purchase-units?reference_code=${refCode}`;
        window.open(url, '_blank'); // opens export URL in new tab
    };

    return (
        <Dropdown className='table-dropdown'>
            <Dropdown.Toggle id='dropdown-autoclose-true' className='text-primary hide-arrow bg-transparent border-0 p-0'>
                <FontAwesomeIcon icon={faEllipsisVertical} className="fs-1"/>
            </Dropdown.Toggle>
            <Dropdown.Menu>

                {/* View icon */}
                {isViewIcon &&
                    <Dropdown.Item onClick={(e) => { e.stopPropagation(); goToDetailScreen(item.id); }} className='py-3 px-4 d-flex align-items-center fs-6'>
                        <FontAwesomeIcon icon={faEye} className='me-2'/>
                        {getFormattedMessage('globally.view.tooltip.label')} {title}
                    </Dropdown.Item>
                }

                {/* PDF icon */}
                {isPdfIcon &&
                    <Dropdown.Item onClick={(e) => { e.stopPropagation(); onPdfClick(item.id); }} className='py-3 px-4 d-flex align-items-center fs-6'>
                        <FontAwesomeIcon icon={faFilePdf} className='me-2'/> 
                        {getFormattedMessage('globally.pdf.download.label')}
                    </Dropdown.Item>
                }

                {/* Barcode Print */}
                <Dropdown.Item 
                    onClick={(e) => { e.stopPropagation(); handleBarcodePrint(reference_code); }} 
                    className='py-3 px-4 d-flex align-items-center fs-6'
                >
                    <FontAwesomeIcon icon={faBarcode} className='me-2'/> 
                    {getFormattedMessage('barcode.print.label') || 'Print Barcode'}
                </Dropdown.Item>

                {/* Show Payment */}
                {item.payment_status !== 2 && isPaymentShow &&
                    <Dropdown.Item onClick={(e) => { e.stopPropagation(); onShowPaymentClick(item); }} className='py-3 px-4 d-flex align-items-center fs-6'>
                        <FontAwesomeIcon icon={faDollarSign} className='me-2'/> 
                        {getFormattedMessage('globally.show.payment.label')}
                    </Dropdown.Item>
                }

                {/* Create Payment */}
                {isCreatePayment && item.payment_status !== 1 &&
                    <Dropdown.Item onClick={(e) => { e.stopPropagation(); onCreatePaymentClick(item); }} className='py-3 px-4 d-flex align-items-center fs-6'>
                        <FontAwesomeIcon icon={faDollarSign} className='me-2'/>
                        {getFormattedMessage("create-payment-title")}
                    </Dropdown.Item>
                }

                {/* Create Sale */}
                {isCreatesSales && !item.is_sale_created &&
                    <Dropdown.Item onClick={(e) => { e.stopPropagation(); onCreateSaleClick(item); }} className='py-3 px-4 d-flex align-items-center fs-6'>
                        <FontAwesomeIcon icon={faCartShopping} className='me-2'/>
                        {getFormattedMessage("sale.create.title")}
                    </Dropdown.Item>
                }

                {/* Sale Return */}
                {config && config.includes(Permissions.MANAGE_SALE_RETURN) && isCreateSaleReturn &&
                    <Dropdown.Item onClick={(e) => { e.stopPropagation(); onCreateSaleReturnClick(item); }} className='py-3 px-4 d-flex align-items-center fs-6'>
                        <FontAwesomeIcon icon={faCartShopping} className='me-2'/>
                        {item.is_return === 1 ? getFormattedMessage("sale-return.edit.title") : getFormattedMessage("sale-return.create.title")}
                    </Dropdown.Item>
                }

                {/* Edit Product */}
                {goToEditProduct && !item.is_sale_created && item.is_return !== 1 &&
                    <Dropdown.Item onClick={(e) => { e.stopPropagation(); goToEditProduct(item); }} className='py-3 px-4 d-flex align-items-center fs-6'>
                        <FontAwesomeIcon icon={faPenToSquare} className='me-2'/>
                        {getFormattedMessage('globally.edit.tooltip.label')} {title}
                    </Dropdown.Item>
                }

                {/* Delete */}
                <Dropdown.Item onClick={(e) => { e.stopPropagation(); onClickDeleteModel(item); }} className='py-3 px-4 d-flex align-items-center fs-6'>
                    <FontAwesomeIcon icon={faTrash} className='me-2'/> 
                    {getFormattedMessage('globally.delete.tooltip.label')} {title}
                </Dropdown.Item>

            </Dropdown.Menu>
        </Dropdown>
    )
}

export default ActionDropDownButton;

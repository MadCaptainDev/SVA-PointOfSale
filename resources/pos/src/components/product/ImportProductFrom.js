import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Form, Modal } from 'react-bootstrap-v5';
import { addToast } from '../../store/action/toastAction';
import { getFormattedMessage, placeholderText } from '../../shared/sharedMethod';
import axios from 'axios';

const ImportProductFrom = ({ handleClose, show, title }) => {
    const [selectFile, setSelectFile] = useState(null);
    const [errors, setErrors] = useState('');
    const dispatch = useDispatch();

    const handleFileChange = (e) => {
        e.preventDefault();
        if (e.target.files.length > 0) {
            const file = e.target.files[0];

            // Accept CSV or Excel
            const allowedTypes = [
                'text/csv',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel'
            ];

            if (!allowedTypes.includes(file.type)) {
                setErrors(getFormattedMessage('globally.csv-or-excel-file.validate.label'));
                setSelectFile(null);
                return;
            }

            setSelectFile(file);
            setErrors('');
            dispatch(addToast({ text: getFormattedMessage('file.success.upload.message') }));
        }
    };

    const handleClick = (e) => e.target.value = '';

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!selectFile) {
            setErrors(getFormattedMessage('globally.file.validate.label'));
            return;
        }

        const formData = new FormData();
        formData.append('file', selectFile);

        try {
            const response = await axios.post(
                'https://pos.svasilksandreadymades.com/api/products/import',
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            dispatch(addToast({ text: 'File uploaded successfully!' }));
            clearFields();
        } catch (error) {
            const message = error.response?.data?.message || 'Something went wrong';
            dispatch(addToast({ text: message, type: 'error' }));
        }
    };

    const clearFields = () => {
        setSelectFile(null);
        setErrors('');
        handleClose(false);
    };

    return (
        <Modal show={show} onHide={clearFields} keyboard>
            <Form>
                <Modal.Header closeButton>
                    <Modal.Title>{title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group controlId='formFile' className='mb-3'>
                        <Form.Control
                            type='file'
                            accept=".csv, .xls, .xlsx"
                            onClick={handleClick}
                            onChange={handleFileChange}
                        />
                        {errors && <span className='text-danger d-block mt-2'>{errors}</span>}
                    </Form.Group>
                    <div className='d-flex justify-content-between'>
                        <button type='button' className='btn btn-primary' onClick={onSubmit}>
                            {placeholderText('globally.save-btn')}
                        </button>
                        <button type='button' className='btn btn-secondary' onClick={clearFields}>
                            {getFormattedMessage('globally.cancel-btn')}
                        </button>
                    </div>
                </Modal.Body>
            </Form>
        </Modal>
    );
};

export default ImportProductFrom;

import React, { useState, useEffect } from 'react';
import { Table, Button } from 'react-bootstrap';

const DataTable = ({ data, onRowClick, onRowEdit, onRowDelete }) => {
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    // Load data on component mount
    if (data) {
      setSelectedRow(null);
      setEditData({});
      setIsEditing(false);
      data.forEach((row) => {
        setTimeout(() => {
          const rowElement = document.createElement('tr');
          row.forEach((cellValue, index) => {
            const cellElement = document.createElement('td');
            cellElement.textContent = cellValue;
            rowElement.appendChild(cellElement);
          });
          document.querySelector('tbody').appendChild(rowElement);
        }, index * 100);
      });
    }
  }, [data]);

  const handleRowClick = (event) => {
    const target = event.target;
    if (target.nodeName === 'TD') {
      const rowIndex = target.parentElement.parentElement.parentElement.dataset.index;
      setSelectedRow(data[rowIndex]);
    }
  };

  const handleEditRow = (rowIndex) => {
    setSelectedRow(data[rowIndex]);
    setEditData(data[rowIndex]);
    setIsEditing(true);
  };

  const handleSaveRow = () => {
    const editedData = { ...editData };
    const updatedData = data.map((row, index) => {
      if (index === selectedRowIndex) {
        return { ...row, ...editedData };
      }
      return row;
    });
    setData(updatedData);
    setEditData(null);
    setIsEditing(false);
  };

  const handleCancelRowEdit = () => {
    setEditData(null);
    setIsEditing(false);
  };

  const handleRowDelete = (rowIndex) => {
    const newData = data.filter((row, index) => index !== rowIndex);
    setData(newData);
  };

  const handleRowEdit = (rowIndex) => {
    const newData = data.map((row, index) => {
      if (index === rowIndex) {
        return { ...row, ...editData };
      }
      return row;
    });
    setData(newData);
    setEditData(null);
    setIsEditing(false);
  };

  const handleRowEditCancel = () => {
    setEditData(null);
    setIsEditing(false);
  };

  return (
    <div className="data-table">
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Column 1</th>
            <th>Column 2</th>
            <th>Column 3</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              <td>{row.Column 1}</td>
              <td>{row.Column 2}</td>
              <td>{row.Column 3}</td>
              <td>
                <button onClick={() => handleRowEdit(index)}>Edit</button>
                <button onClick={() => handleRowDelete(index)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
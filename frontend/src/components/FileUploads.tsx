import React, { useState } from 'react';

const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return setMessage('Please select a file first');
    if (file.type !== 'application/pdf') return setMessage('Only PDF files are allowed.');

    const formData = new FormData();
    formData.append('pdf', file);

    const res = await fetch('http://localhost:4000/api/files/upload', {
      method: 'POST',
      body: formData,
      // Include auth token if needed
    });

    const data = await res.json();
    setMessage(data.message);
  };

  return (
    <div>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload PDF</button>
      <p>{message}</p>
    </div>
  );
};

export default FileUpload;

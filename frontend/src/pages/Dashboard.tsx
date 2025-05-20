import { useEffect, useState } from 'react';
import axios from 'axios';

interface FileData {
  _id: string;
  originalname: string;
  uploadDate: string;
  filename: string;
  size: number;
  // Add other fields you need from your backend
}

export default function Dashboard() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchFiles = async (query = '') => {
    try {
      setLoading(true);
      setError('');
      const url = query 
        ? `/api/search?q=${encodeURIComponent(query)}`
        : '/api/my-files';
      const response = await axios.get<FileData[]>(url);
      setFiles(response.data);
    } catch (err) {
      setError('Failed to fetch files');
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFiles(search);
  };

  return (
    <div className="dashboard">
      <h1>My Files</h1>
      
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search files..."
        />
        <button type="submit">Search</button>
      </form>

      {loading && <p>Loading files...</p>}
      {error && <p className="error">{error}</p>}

      <div className="file-list">
        {files.map((file) => (
          <div key={file._id} className="file-item">
            <h3>{file.originalname}</h3>
            <p>Uploaded: {new Date(file.uploadDate).toLocaleDateString()}</p>
            <p>Size: {(file.size / 1024).toFixed(2)} KB</p>
            {/* Add download/view buttons as needed */}
          </div>
        ))}
      </div>
    </div>
  );
}
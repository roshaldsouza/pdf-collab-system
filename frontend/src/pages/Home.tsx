import { useEffect, useState } from 'react';
import axios from 'axios';

interface FileType {
  id: string;
  filename: string;
  originalname: string;
  uploadedBy: string;
}

export default function Home() {
  const [files, setFiles] = useState<FileType[]>([]);
  const [query, setQuery] = useState('');

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/files?q=${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFiles(res.data);
    } catch (err) {
      console.error('Error fetching files', err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [query]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Your Uploaded PDFs</h1>

      <input
        type="text"
        placeholder="Search files..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="p-2 border rounded mb-4 w-full"
      />

      <ul>
        {files.map((file) => (
          <li key={file.id} className="mb-2">
            <a
              href={`/uploads/${file.filename}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              {file.originalname}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

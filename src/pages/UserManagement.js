import { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Edit,
    Trash2,
    Save,
    X,
    DollarSign,
    Droplets,
    FileText,
    Home,
    Users,
    Settings,
    BarChart2
} from 'lucide-react';

// Mock data for water users
const initialUsers = [
    { id: 1, name: "สมชาย ใจดี", address: "123/4 หมู่ 5", meterNo: "WM10001", lastReading: 245, status: "active", debt: 0 },
    { id: 2, name: "วิชัย มานะ", address: "45/2 หมู่ 5", meterNo: "WM10002", lastReading: 178, status: "active", debt: 150 },
    { id: 3, name: "ประภา สุขใจ", address: "89/7 หมู่ 5", meterNo: "WM10003", lastReading: 320, status: "inactive", debt: 450 },
    { id: 4, name: "สมหญิง รักษ์น้ำ", address: "56/8 หมู่ 5", meterNo: "WM10004", lastReading: 290, status: "active", debt: 0 },
    { id: 5, name: "ประสิทธิ์ พอเพียง", address: "112/9 หมู่ 5", meterNo: "WM10005", lastReading: 145, status: "active", debt: 0 },
];

export default function WaterAdminPanel() {
    const [users, setUsers] = useState(initialUsers);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [newUser, setNewUser] = useState({
        name: '',
        address: '',
        meterNo: '',
        lastReading: 0,
        status: 'active',
        debt: 0
    });
    const [showNewUserForm, setShowNewUserForm] = useState(false);
    const [activeTab, setActiveTab] = useState('users');

    // Filter users based on search term
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.meterNo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Start editing a user
    const handleEdit = (user) => {
        setEditingId(user.id);
        setEditForm({ ...user });
    };

    // Save edited user
    const handleSaveEdit = () => {
        setUsers(users.map(user => user.id === editingId ? editForm : user));
        setEditingId(null);
    };

    // Delete a user
    const handleDelete = (id) => {
        if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบผู้ใช้น้ำรายนี้?')) {
            setUsers(users.filter(user => user.id !== id));
        }
    };

    // Add new user
    const handleAddUser = () => {
        const newId = Math.max(...users.map(user => user.id)) + 1;
        setUsers([...users, { ...newUser, id: newId }]);
        setNewUser({
            name: '',
            address: '',
            meterNo: '',
            lastReading: 0,
            status: 'active',
            debt: 0
        });
        setShowNewUserForm(false);
    };

    // Handle change in input fields for editing
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm({ ...editForm, [name]: value });
    };

    // Handle change in input fields for new user
    const handleNewUserChange = (e) => {
        const { name, value } = e.target;
        setNewUser({ ...newUser, [name]: value });
    };

    return (
        <div className="flex-1 overflow-auto">


            <main className="p-6">
                {/* User Management Controls */}
                <div className="mb-6 flex justify-between items-center">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="ค้นหาตามชื่อหรือรหัสมิเตอร์"
                            className="pl-10 pr-4 py-2 border rounded-lg w-80"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    </div>
                    <button
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
                        onClick={() => setShowNewUserForm(true)}
                    >
                        <Plus size={18} className="mr-2" />
                        เพิ่มผู้ใช้น้ำ
                    </button>
                </div>

                {/* New User Form */}
                {showNewUserForm && (
                    <div className="bg-white p-4 mb-6 rounded-lg shadow">
                        <div className="flex justify-between mb-4">
                            <h2 className="text-lg font-semibold">เพิ่มผู้ใช้น้ำใหม่</h2>
                            <button onClick={() => setShowNewUserForm(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">ชื่อ-นามสกุล</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="w-full p-2 border rounded"
                                    value={newUser.name}
                                    onChange={handleNewUserChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">ที่อยู่</label>
                                <input
                                    type="text"
                                    name="address"
                                    className="w-full p-2 border rounded"
                                    value={newUser.address}
                                    onChange={handleNewUserChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">รหัสมิเตอร์</label>
                                <input
                                    type="text"
                                    name="meterNo"
                                    className="w-full p-2 border rounded"
                                    value={newUser.meterNo}
                                    onChange={handleNewUserChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">เลขมิเตอร์เริ่มต้น</label>
                                <input
                                    type="number"
                                    name="lastReading"
                                    className="w-full p-2 border rounded"
                                    value={newUser.lastReading}
                                    onChange={handleNewUserChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">สถานะ</label>
                                <select
                                    name="status"
                                    className="w-full p-2 border rounded"
                                    value={newUser.status}
                                    onChange={handleNewUserChange}
                                >
                                    <option value="active">ใช้งาน</option>
                                    <option value="inactive">ยกเลิก</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded mr-2"
                                onClick={() => setShowNewUserForm(false)}
                            >
                                ยกเลิก
                            </button>
                            <button
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                                onClick={handleAddUser}
                            >
                                บันทึก
                            </button>
                        </div>
                    </div>
                )}

                {/* Users Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รหัสมิเตอร์</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อ-นามสกุล</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ที่อยู่</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เลขมิเตอร์ล่าสุด</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ยอดค้างชำระ</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map(user => (
                                <tr key={user.id}>
                                    {editingId === user.id ? (
                                        <>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="text"
                                                    name="meterNo"
                                                    className="w-full p-1 border rounded"
                                                    value={editForm.meterNo}
                                                    onChange={handleEditChange}
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="text"
                                                    name="name"
                                                    className="w-full p-1 border rounded"
                                                    value={editForm.name}
                                                    onChange={handleEditChange}
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="text"
                                                    name="address"
                                                    className="w-full p-1 border rounded"
                                                    value={editForm.address}
                                                    onChange={handleEditChange}
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="number"
                                                    name="lastReading"
                                                    className="w-full p-1 border rounded"
                                                    value={editForm.lastReading}
                                                    onChange={handleEditChange}
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="number"
                                                    name="debt"
                                                    className="w-full p-1 border rounded"
                                                    value={editForm.debt}
                                                    onChange={handleEditChange}
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select
                                                    name="status"
                                                    className="w-full p-1 border rounded"
                                                    value={editForm.status}
                                                    onChange={handleEditChange}
                                                >
                                                    <option value="active">ใช้งาน</option>
                                                    <option value="inactive">ยกเลิก</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    className="text-green-600 hover:text-green-900 mr-3"
                                                    onClick={handleSaveEdit}
                                                >
                                                    <Save size={18} />
                                                </button>
                                                <button
                                                    className="text-gray-600 hover:text-gray-900"
                                                    onClick={() => setEditingId(null)}
                                                >
                                                    <X size={18} />
                                                </button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-6 py-4 whitespace-nowrap">{user.meterNo}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{user.address}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{user.lastReading}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={user.debt > 0 ? "text-red-600" : "text-green-600"}>
                                                    ฿{user.debt}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {user.status === 'active' ? 'ใช้งาน' : 'ยกเลิก'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    className="text-blue-600 hover:text-blue-900 mr-3"
                                                    onClick={() => handleEdit(user)}
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    className="text-red-600 hover:text-red-900"
                                                    onClick={() => handleDelete(user.id)}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
async function testUpdate() {
    const baseURL = 'http://localhost:3000/api/v1';
    
    try {
        // 1. Login to get token
        const loginRes = await fetch(`${baseURL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@empresa.com',
                password: '123456'
            })
        });
        const loginData = await loginRes.json();
        const token = loginData.access_token;
        
        const headers = { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        // 2. Get users to find one to edit
        const usersRes = await fetch(`${baseURL}/users`, { headers });
        const usersData = await usersRes.json();
        const user = usersData.data.find(u => u.name.includes('João'));
        
        if (!user) {
            console.log('User João not found');
            return;
        }
        
        console.log('Updating user:', user.name, user.id);
        console.log('Current departments:', user.departments.map(d => d.name));
        
        // 3. Get all departments to find Administration
        const deptsRes = await fetch(`${baseURL}/departments`, { headers });
        const deptsData = await deptsRes.json();
        const adminDept = deptsData.data.find(d => d.name === 'Administração');
        const tiDept = deptsData.data.find(d => d.name === 'TI');
        
        console.log('Admin Dept ID:', adminDept.id);
        
        // 4. Try to update departments to include both
        const updateRes = await fetch(`${baseURL}/admin/users/${user.id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                name: user.name,
                email: user.email,
                roleId: user.role.id,
                departmentIds: [tiDept.id, adminDept.id]
            })
        });
        
        console.log('Update response status:', updateRes.status);
        const updateData = await updateRes.json();
        
        if (updateData.departments) {
            console.log('Updated user departments:', updateData.departments.map(d => d.name));
            if (updateData.departments.length === 2) {
                console.log('SUCCESS: Persistence working');
            } else {
                console.log('FAILURE: Persistence NOT working');
            }
        } else {
            console.log('Update failed or returned unexpected body:', updateData);
        }
    } catch (error) {
        console.error('Update failed:', error.message);
    }
}

testUpdate();

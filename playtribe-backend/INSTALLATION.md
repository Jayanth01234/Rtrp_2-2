# Profile Image Upload Installation

## Manual Installation Steps

### 1. Install Multer
Since npm install is failing, manually install multer:

```bash
cd playtribe-backend
npm install multer@1.4.5
```

### 2. Verify Installation
Check if multer is installed:
```bash
npm list multer
```

### 3. Test Upload System

1. Start the backend:
```bash
npm run dev
```

2. Check console for:
- "MongoDB Connected" message
- "Server running on port 5000" message
- Uploads directory creation message

3. Test the upload endpoint:
```bash
curl -X POST http://localhost:5000/api/users/upload-profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "profileImage=@/path/to/your/image.jpg"
```

## Common Issues & Solutions

### Issue: "Cannot find module 'multer'"
**Solution**: Ensure node_modules exists and multer is installed

### Issue: "Upload failed" error
**Solution**: Check backend console logs for specific error messages

### Issue: Network error in frontend
**Solution**: 
1. Backend is running on port 5000
2. No CORS issues
3. JWT token is valid

## Debug Information

The upload system includes comprehensive logging:
- Backend: Logs all upload steps
- Frontend: Logs API calls and responses
- Error handling: Detailed error messages

Check the browser console and backend terminal for specific error details.

import Hostel from "../Models/Hostel.js";
import Category from "../Models/Category.js";
import Banner from "../Models/Banner.js";
import Admin from "../Models/Admin.js";
import Vendor from "../Models/Vendor.js";
import jwt from "jsonwebtoken";
import Notification from "../Models/Notification.js";
import QRCode from "qrcode";
import fs from "fs";
import FormUser from "../Models/FormUser.js";

const getImageUrl = (req, path) => {
  return `${req.protocol}://${req.get("host")}/${path}`;
};

const getBaseUrl = (req) => {
  // Use BASE_URL from .env if available
  if (process.env.BASE_URL) {
    console.log("✅ Using BASE_URL from .env:", process.env.BASE_URL);
    return process.env.BASE_URL;
  }

  // Fallback to request URL
  console.log("⚠️ Using fallback URL:", `${req.protocol}://${req.get('host')}`);
  return `${req.protocol}://${req.get('host')}`;
};


export const createVendorNotification = async (vendorId, message, type = "info") => {
  try {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      console.error("❌ Vendor not found:", vendorId);
      return;
    }

    vendor.notifications.push({ message, type, read: false });
    await vendor.save();

    console.log("✅ Notification saved for vendor:", vendorId);
  } catch (err) {
    console.error("❌ Error creating vendor notification:", err.message);
  }
};


// helper
const formatHostel = (hostel, req) => {
  // Get base URL for images
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  return {
    _id: hostel._id,
    categoryId: hostel.categoryId,
    adminId: hostel.adminId,
    vendorId: hostel.vendorId,
    name: hostel.name,
    rating: hostel.rating,
    address: hostel.address,
    monthlyAdvance: hostel.monthlyAdvance,
    latitude: hostel.location?.coordinates[1],
    longitude: hostel.location?.coordinates[0],
    sharings: hostel.sharings || [],
    images: hostel.images?.map(img => `${baseUrl}/${img}`) || [],
    qrCode: hostel.qrCode || null, // Include QR code
    qrUrl: hostel.qrCode ? `${baseUrl}/api/Admin/hostel/${hostel._id}/qrcode` : null, // QR URL
    createdAt: hostel.createdAt,
    updatedAt: hostel.updatedAt
  };
};
const formatLocation = (location) => {

  if (!location || !location.coordinates) return {};

  return {
    latitude: location.coordinates[1],
    longitude: location.coordinates[0]
  };

};



// Updated generateFormHTML with new fields while maintaining old design
const generateFormHTML = (hostelId) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />
  <meta name="google" content="notranslate" />
  <title>Hostel Registration</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
  <style>
    :root { --bg:#0d0f14;--card:#1c2030;--border:rgba(255,255,255,0.07);--accent:#f0b429;--text:#f0ede8;--muted:#8a8fa8;--success:#3ecf6e;--error:#f06060;--input-bg:#111420;--gradient:linear-gradient(135deg,#f0b429,#e8825a); }
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
    body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 60% 50% at 10% 10%,rgba(240,180,41,0.08) 0%,transparent 60%),radial-gradient(ellipse 50% 60% at 90% 90%,rgba(232,130,90,0.07) 0%,transparent 60%);pointer-events:none;z-index:0}
    .pw{position:relative;z-index:1;width:100%;max-width:480px}
    .brand{display:flex;align-items:center;gap:10px;margin-bottom:24px;animation:slideDown .6s cubic-bezier(.22,1,.36,1) both}
    .brand-icon{width:38px;height:38px;background:var(--gradient);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px}
    .brand-name{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700}
    .brand-tag{margin-left:auto;font-size:.7rem;font-weight:500;color:var(--accent);background:rgba(240,180,41,0.1);border:1px solid rgba(240,180,41,0.2);padding:3px 10px;border-radius:20px;letter-spacing:.08em;text-transform:uppercase}
    .card{background:var(--card);border:1px solid var(--border);border-radius:24px;padding:36px 32px;box-shadow:0 32px 80px rgba(0,0,0,0.5);animation:fadeUp .7s cubic-bezier(.22,1,.36,1) .1s both}
    .ch{margin-bottom:32px}
    .ch h1{font-family:'Playfair Display',serif;font-size:1.9rem;font-weight:900;line-height:1.15;margin-bottom:8px;background:linear-gradient(135deg,#f0ede8,#c8c4be);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    .ch p{font-size:.88rem;color:var(--muted);line-height:1.5}
    .dv{display:flex;align-items:center;gap:12px;margin-bottom:28px}
    .dl{flex:1;height:1px;background:var(--border)}
    .dt{font-size:.72rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.1em}
    .field{margin-bottom:20px}
    .field label{display:flex;align-items:center;gap:6px;font-size:.8rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px}
    .field label .req{color:var(--accent);font-size:.9rem}
    .iw{position:relative}
    .iw .ic{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:16px;opacity:.5;pointer-events:none}
    input[type=text],input[type=tel],input[type=email],input[type=number],input[type=date],select{
      width:100%;
      padding:12px 14px 12px 42px;
      background:var(--input-bg);
      border:1.5px solid var(--border);
      border-radius:12px;
      color:var(--text);
      font-family:'DM Sans',sans-serif;
      font-size:.95rem;
      outline:none;
      transition:border-color .2s,box-shadow .2s;
    }
    select {
      appearance: none;
      cursor: pointer;
      padding:12px 14px 12px 42px;
    }
    select option {
      background: var(--card);
      color: var(--text);
    }
    input[type=text]::placeholder,input[type=tel]::placeholder,input[type=email]::placeholder,input[type=number]::placeholder,input[type=date]::placeholder{color:var(--muted);opacity:.6}
    input[type=text]:focus,input[type=tel]:focus,input[type=email]:focus,input[type=number]:focus,input[type=date]:focus,select:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(240,180,41,0.12)}
    input[type=text].error,input[type=tel].error,input[type=email].error,input[type=number].error,input[type=date].error,select.error{border-color:var(--error);box-shadow:0 0 0 3px rgba(240,96,96,0.12)}
    .hint{font-size:.75rem;color:var(--muted);margin-top:5px}
    .fr{display:flex;align-items:center;gap:12px;background:var(--input-bg);border:1.5px dashed var(--border);border-radius:12px;padding:12px 14px;cursor:pointer;transition:border-color .2s,background .2s}
    .fr:hover{border-color:var(--accent);background:rgba(240,180,41,0.04)}
    .fr.has-file{border-color:var(--success);border-style:solid;background:rgba(62,207,110,0.05)}
    .fi{width:36px;height:36px;border-radius:9px;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
    .fr.has-file .fi{background:rgba(62,207,110,0.12)}
    .ft{flex:1;min-width:0}
    .ft .flt{font-size:.88rem;font-weight:500;color:var(--text);display:block}
    .ft .fn{font-size:.75rem;color:var(--muted);display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
    .fr.has-file .ft .fn{color:var(--success)}
    .fb{font-size:.7rem;padding:3px 8px;border-radius:6px;background:rgba(255,255,255,0.06);color:var(--muted);flex-shrink:0}
    .fr.has-file .fb{background:rgba(62,207,110,0.12);color:var(--success)}
    input[type=file]{display:none}
    .sb{width:100%;padding:14px 20px;background:var(--gradient);border:none;border-radius:14px;color:#0d0f14;font-family:'DM Sans',sans-serif;font-size:.95rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;margin-top:8px;transition:opacity .2s,transform .15s}
    .sb:active{transform:scale(.98)}
    .sb:disabled{opacity:.5;cursor:not-allowed;transform:none}
    .sp{width:18px;height:18px;border:2.5px solid rgba(13,15,20,0.3);border-top-color:#0d0f14;border-radius:50%;animation:spin .7s linear infinite;display:none}
    #toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(20px);padding:10px 22px;border-radius:10px;font-size:.88rem;font-weight:500;opacity:0;transition:all .3s;pointer-events:none;white-space:nowrap;z-index:100}
    #toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
    #toast.success{background:var(--success);color:#0a2016}
    #toast.error{background:var(--error);color:#fff}
    #ss{display:none;flex-direction:column;align-items:center;text-align:center;padding:20px 0 8px}
    .sr{width:80px;height:80px;border-radius:50%;background:rgba(62,207,110,0.1);border:2px solid rgba(62,207,110,0.25);display:flex;align-items:center;justify-content:center;margin-bottom:20px;animation:popIn .5s cubic-bezier(.34,1.56,.64,1) both}
    .sr svg{width:36px;height:36px}
    #ss h2{font-family:'Playfair Display',serif;font-size:1.6rem;font-weight:900;color:var(--success);margin-bottom:10px}
    #ss p{color:var(--muted);font-size:.88rem;line-height:1.6;max-width:260px}
    .sd{width:40px;height:2px;background:var(--gradient);border-radius:2px;margin:20px auto}
    .cf{margin-top:22px;text-align:center;font-size:.76rem;color:var(--muted)}
    @keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slideDown{from{opacity:0;transform:translateY(-16px)}to{opacity:1;transform:translateY(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes popIn{from{transform:scale(.4);opacity:0}to{transform:scale(1);opacity:1}}
    @media(max-width:440px){.card{padding:28px 20px}.ch h1{font-size:1.6rem}}
  </style>
</head>
<body>
<div class="pw">
  <div class="brand">
    <div class="brand-icon">🏠</div>
    <span class="brand-name">Brando</span>
    <span class="brand-tag">Secure Check-in</span>
  </div>
  <div class="card">
    <div id="fb">
      <div class="ch">
        <h1>Guest Registration</h1>
        <p>Fill in your details to complete your registration. Fields marked <span style="color:var(--accent)">*</span> are required.</p>
      </div>
      <form id="rf" novalidate>
        <input type="hidden" id="hostelId" value="${hostelId}" />
        <div class="dv"><div class="dl"></div><span class="dt">Personal Info</span><div class="dl"></div></div>
        <div class="field">
          <label for="name">Full Name <span class="req">*</span></label>
          <div class="iw"><span class="ic">👤</span><input type="text" id="name" placeholder="e.g. Ravi Kumar" autocomplete="name" /></div>
        </div>
        <div class="field">
          <label for="email">Email Address <span class="req">*</span></label>
          <div class="iw"><span class="ic">✉️</span><input type="email" id="email" placeholder="your.email@example.com" autocomplete="email" /></div>
        </div>
        <div class="field">
          <label for="mobile">Mobile Number <span class="req">*</span></label>
          <div class="iw"><span class="ic">📱</span><input type="tel" id="mobile" placeholder="10-digit mobile number" maxlength="10" /></div>
        </div>
        <div class="field">
          <label for="en">Emergency Contact</label>
          <div class="iw"><span class="ic">🆘</span><input type="tel" id="en" placeholder="Emergency contact (optional)" maxlength="10" /></div>
          <span class="hint">A family member or guardian's number is recommended.</span>
        </div>
        
        <div class="dv" style="margin-top:8px"><div class="dl"></div><span class="dt">Stay Details</span><div class="dl"></div></div>
        
        <div class="field">
          <label for="roomNo">Room Number <span class="req">*</span></label>
          <div class="iw"><span class="ic">🚪</span><input type="text" id="roomNo" placeholder="e.g., 101, A-202" /></div>
        </div>
        
        <div class="field">
          <label for="joiningDate">Joining Date <span class="req">*</span></label>
          <div class="iw"><span class="ic">📅</span><input type="date" id="joiningDate" /></div>
        </div>
        
        <div class="field">
          <label for="tenure">Tenure <span class="req">*</span></label>
          <div class="iw"><span class="ic">⏱️</span>
            <select id="tenure">
              <option value="">Select tenure</option>
              <option value="monthly">Monthly</option>
              <option value="daily">Daily</option>
            </select>
          </div>
        </div>
        
        <div class="field">
          <label for="roomType">Room Type <span class="req">*</span></label>
          <div class="iw"><span class="ic">❄️</span>
            <select id="roomType">
              <option value="">Select room type</option>
              <option value="AC">AC</option>
              <option value="Non-AC">Non-AC</option>
            </select>
          </div>
        </div>
        
        <div class="field">
          <label for="advance">Advance Amount (₹) <span class="req">*</span></label>
          <div class="iw"><span class="ic">💰</span><input type="number" id="advance" placeholder="Enter advance amount" min="0" step="1" /></div>
        </div>
        
        <div class="dv" style="margin-top:8px"><div class="dl"></div><span class="dt">Documents</span><div class="dl"></div></div>
        <div class="field">
          <label>Aadhar Card</label>
          <label class="fr" for="aadhar" id="aadhar-row">
            <div class="fi">🪪</div>
            <div class="ft"><span class="flt">Upload Aadhar Card</span><span class="fn" id="aadhar-name">Image or PDF · Max 5MB</span></div>
            <span class="fb" id="aadhar-badge">Browse</span>
          </label>
          <input type="file" id="aadhar" accept="image/*,.pdf" />
        </div>
        <div class="field">
          <label>College / Company ID Card</label>
          <label class="fr" for="idCard" id="idCard-row">
            <div class="fi">🎓</div>
            <div class="ft"><span class="flt">Upload ID Card</span><span class="fn" id="idCard-name">Image or PDF · Max 5MB</span></div>
            <span class="fb" id="idCard-badge">Browse</span>
          </label>
          <input type="file" id="idCard" accept="image/*,.pdf" />
        </div>
        <div class="field">
          <label>Profile Photo</label>
          <label class="fr" for="profileImage" id="profileImage-row">
            <div class="fi">📷</div>
            <div class="ft"><span class="flt">Upload Profile Photo</span><span class="fn" id="profileImage-name">JPG, PNG · Max 5MB</span></div>
            <span class="fb" id="profileImage-badge">Browse</span>
          </label>
          <input type="file" id="profileImage" accept="image/*" />
        </div>
        <button type="submit" class="sb" id="submitBtn">
          <div class="sp" id="spinner"></div>
          <span id="bi">✓</span>
          <span id="bt">Complete Registration</span>
        </button>
      </form>
    </div>
    <div id="ss">
      <div class="sr">
        <svg viewBox="0 0 24 24" fill="none" stroke="#3ecf6e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <h2>You're Checked In!</h2>
      <p>Your registration has been submitted successfully. Welcome to the hostel family!</p>
      <div class="sd"></div>
      <p style="font-size:.8rem">Management will verify your documents and reach out shortly.</p>
    </div>
  </div>
  <div class="cf">🔒 Your data is securely encrypted &amp; protected</div>
</div>
<div id="toast"></div>
<script>
  ['aadhar','idCard','profileImage'].forEach(function(id){
    document.getElementById(id).addEventListener('change',function(){
      var row=document.getElementById(id+'-row'),name=document.getElementById(id+'-name'),badge=document.getElementById(id+'-badge');
      if(this.files&&this.files[0]){name.textContent=this.files[0].name;badge.textContent='✓ Added';row.classList.add('has-file');}
      else{name.textContent='Choose file';badge.textContent='Browse';row.classList.remove('has-file');}
    });
  });
  function showToast(msg,type){var t=document.getElementById('toast');t.textContent=msg;t.className=(type||'success')+' show';setTimeout(function(){t.classList.remove('show');},3600);}
  function setError(id,on){var el=document.getElementById(id);if(on)el.classList.add('error');else el.classList.remove('error');}
  document.getElementById('rf').addEventListener('submit',async function(e){
    e.preventDefault();
    var name=document.getElementById('name').value.trim();
    var email=document.getElementById('email').value.trim();
    var mobile=document.getElementById('mobile').value.trim();
    var roomNo=document.getElementById('roomNo').value.trim();
    var joiningDate=document.getElementById('joiningDate').value;
    var tenure=document.getElementById('tenure').value;
    var roomType=document.getElementById('roomType').value;
    var advance=document.getElementById('advance').value;
    var hostelId=document.getElementById('hostelId').value.trim();
    var valid=true;
    
    if(!name){setError('name',true);showToast('Full name is required','error');valid=false;}else setError('name',false);
    if(!email){setError('email',true);showToast('Email address is required','error');valid=false;}
    else if(!/^[^\\s@]+@([^\\s@]+\\.)+[^\\s@]+$/.test(email)){setError('email',true);showToast('Enter valid email address','error');valid=false;}
    else setError('email',false);
    if(!mobile){setError('mobile',true);if(valid)showToast('Mobile number is required','error');valid=false;}
    else if(!/^\\d{10}$/.test(mobile)){setError('mobile',true);if(valid)showToast('Enter valid 10-digit mobile number','error');valid=false;}
    else setError('mobile',false);
    if(!roomNo){setError('roomNo',true);showToast('Room number is required','error');valid=false;}else setError('roomNo',false);
    if(!joiningDate){setError('joiningDate',true);showToast('Joining date is required','error');valid=false;}else setError('joiningDate',false);
    if(!tenure){setError('tenure',true);showToast('Tenure selection is required','error');valid=false;}else setError('tenure',false);
    if(!roomType){setError('roomType',true);showToast('Room type selection is required','error');valid=false;}else setError('roomType',false);
    if(advance === '' || advance === null){setError('advance',true);showToast('Advance amount is required','error');valid=false;}
    else if(isNaN(advance) || advance < 0){setError('advance',true);showToast('Advance amount must be a valid number greater than or equal to 0','error');valid=false;}
    else setError('advance',false);
    
    if(!valid)return;
    var btn=document.getElementById('submitBtn'),sp=document.getElementById('spinner'),bi=document.getElementById('bi'),bt=document.getElementById('bt');
    btn.disabled=true;sp.style.display='block';bi.style.display='none';bt.textContent='Submitting...';
    var fd=new FormData();
    fd.append('hostelId',hostelId);
    fd.append('name',name);
    fd.append('email',email);
    fd.append('mobile',mobile);
    fd.append('roomNo',roomNo);
    fd.append('joiningDate',joiningDate);
    fd.append('tenure',tenure);
    fd.append('roomType',roomType);
    fd.append('advance',advance);
    
    var en=document.getElementById('en').value.trim();if(en)fd.append('emergencyNumber',en);
    var a=document.getElementById('aadhar').files[0],ic=document.getElementById('idCard').files[0],pi=document.getElementById('profileImage').files[0];
    if(a)fd.append('aadhar',a);if(ic)fd.append('idCard',ic);if(pi)fd.append('profileImage',pi);
    try{
      var res=await fetch(window.location.origin+'/api/Admin/submit-form',{method:'POST',body:fd});
      var data=await res.json();
      if(data.success){document.getElementById('fb').style.display='none';document.getElementById('ss').style.display='flex';}
      else{showToast(data.message||'Submission failed. Try again.','error');reset();}
    }catch(err){showToast('Network error. Check connection.','error');reset();}
    function reset(){btn.disabled=false;sp.style.display='none';bi.style.display='inline';bt.textContent='Complete Registration';}
  });
</script>
</body>
</html>`;


export const adminLogin = async (req, res) => {

  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required"
      });
    }

    let admin = await Admin.findOne({ email });

    // create admin if not exists
    if (!admin) {
      admin = await Admin.create({
        email: "admin123@gmail.com",
        password: "Admin@123"
      });
    }

    if (admin.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid password"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Admin login successful"
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }

};



export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Category name required" });

    const existing = await Category.findOne({ name });
    if (existing) return res.status(409).json({ success: false, message: "Category already exists" });

    const category = await Category.create({ name });
    return res.status(201).json({ success: true, message: "Category created successfully", category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    return res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });

    return res.status(200).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCategoryById = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Category name required" });

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });

    return res.status(200).json({ success: true, message: "Category updated successfully", category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCategoryById = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });

    return res.status(200).json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============= HOSTEL CONTROLLERS =============




export const createHostel = async (req, res) => {
  try {
    const {
      categoryId,
      adminId,
      vendorId,
      name,
      rating,
      latitude,
      longitude,
      address,
      monthlyAdvance,
      sharings
    } = req.body;

    let parsed = typeof sharings === "string" ? JSON.parse(sharings) : sharings;

    if (!parsed || !parsed.length) {
      return res.status(400).json({
        success: false,
        message: "Sharings required"
      });
    }

    parsed = parsed.map(s => ({
      type: s.type?.toLowerCase() === "ac" ? "AC" : "Non-AC",
      shareType: s.shareType,
      monthlyPrice: Number(s.monthlyPrice),
      dailyPrice: Number(s.dailyPrice)
    }));

    const images = req.files
      ? req.files.map(f => `uploads/${f.filename}`)
      : [];

    const hostel = await Hostel.create({
      categoryId,
      adminId: adminId || null,
      vendorId: vendorId || null,
      name,
      rating,
      address,
      monthlyAdvance,
      sharings: parsed,
      images,
      location: {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)]
      }
    });

    if (vendorId) {
      await createVendorNotification(
        vendorId,
        `Your hostel "${name}" has been added to the platform successfully.`,
        "success"
      );
    }


    // Generate QR code
    const baseUrl = getBaseUrl(req);
    const formUrl = `${baseUrl}/api/Admin/hostel/${hostel._id}/qrcode`;
    const qrCodeDataURL = await QRCode.toDataURL(formUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400
    });

    hostel.qrCode = qrCodeDataURL;
    await hostel.save();

    return res.status(201).json({
      success: true,
      message: "Created successfully",
      hostel: formatHostel(hostel, req),
      qrUrl: formUrl // Also return the URL for debugging
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};




// =============================================================================
//  HOSTEL — SERVE FORM PAGE  ← QR scans hit this route
// =============================================================================
export const serveFormPage = async (req, res) => {
  try {
    const { hostelId } = req.params;
    console.log("📝 QR scanned — serving form for hostel:", hostelId);

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return res.status(404).send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#0d0f14;color:#fff">
          <h2 style="color:#f06060">Hostel Not Found</h2>
          <p>This registration link is invalid or expired.</p>
        </body></html>
      `);
    }

    console.log("✅ Serving form for:", hostel.name);
    res.setHeader("Content-Type", "text/html");
    res.send(generateFormHTML(hostelId));
  } catch (err) {
    console.error("❌ Error serving form:", err);
    res.status(500).send(`<html><body style="background:#0d0f14;color:#fff;padding:40px"><p>Error: ${err.message}</p></body></html>`);
  }
};

export const getAllHostels = async (req, res) => {
  try {
    const { type } = req.query;
    const query = type ? { "sharings.type": type } : {};
    const hostels = await Hostel.find(query).sort({ createdAt: -1 });

    const response = hostels.map(hostel => {
      let filteredSharings = hostel.sharings;
      if (type) {
        filteredSharings = hostel.sharings.filter(s => s.type === type);
      }

      const roomTypes = type
        ? [type]
        : [...new Set(hostel.sharings.map(s => s.type))];

      return {
        _id: hostel._id,
        categoryId: hostel.categoryId,
        adminId: hostel.adminId,
        vendorId: hostel.vendorId,
        name: hostel.name,
        rating: hostel.rating,
        address: hostel.address,
        monthlyAdvance: hostel.monthlyAdvance,
        latitude: hostel.location.coordinates[1],
        longitude: hostel.location.coordinates[0],
        type: roomTypes,
        rooms: {
          ac: type === "AC"
            ? filteredSharings
            : filteredSharings.filter(s => s.type === "AC"),
          nonAc: type === "Non-AC"
            ? filteredSharings
            : filteredSharings.filter(s => s.type === "Non-AC")
        },
        images: hostel.images.map(img => `${req.protocol}://${req.get("host")}/${img}`),
        qrCode: hostel.qrCode, // Add QR code
        qrUrl: `${getBaseUrl(req)}/api/Admin/hostel/${hostel._id}/qrcode`, // Add QR URL
        createdAt: hostel.createdAt,
        updatedAt: hostel.updatedAt
      };
    });

    res.status(200).json({
      success: true,
      count: response.length,
      hostels: response
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const getHostelById = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);

    if (!hostel) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    // Make sure you're using the updated formatHostel function
    res.json({ success: true, hostel: formatHostel(hostel, req) });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



export const getHostelsByVendorId = async (req, res) => {
  try {
    const hostels = await Hostel.find({ vendorId: req.params.vendorId });

    res.json({
      success: true,
      count: hostels.length,
      hostels: hostels.map(h => formatHostel(h, req)) // This will now include QR code
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getHostelsByAdminId = async (req, res) => {
  try {
    const hostels = await Hostel.find({ adminId: req.params.adminId });

    res.json({
      success: true,
      count: hostels.length,
      hostels: hostels.map(h => formatHostel(h, req)) // This will now include QR code
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};





// ✅ UPDATE
// ✅ UPDATE - FIXED VERSION
export const updateHostelById = async (req, res) => {
  try {
    // Get the existing hostel first
    const existingHostel = await Hostel.findById(req.params.id);

    if (!existingHostel) {
      return res.status(404).json({
        success: false,
        message: "Hostel not found"
      });
    }

    // Prepare update data
    const updateData = {};

    // Handle text fields
    const textFields = ['name', 'address', 'monthlyAdvance', 'rating', 'categoryId', 'adminId', 'vendorId'];
    textFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Handle location (latitude/longitude)
    if (req.body.latitude !== undefined && req.body.longitude !== undefined) {
      updateData.location = {
        type: "Point",
        coordinates: [Number(req.body.longitude), Number(req.body.latitude)]
      };
    } else if (req.body.latitude !== undefined) {
      updateData.location = {
        type: "Point",
        coordinates: [existingHostel.location.coordinates[0], Number(req.body.latitude)]
      };
    } else if (req.body.longitude !== undefined) {
      updateData.location = {
        type: "Point",
        coordinates: [Number(req.body.longitude), existingHostel.location.coordinates[1]]
      };
    }

    // Handle sharings - parse JSON string if present
    if (req.body.sharings !== undefined) {
      try {
        let parsedSharings = typeof req.body.sharings === "string"
          ? JSON.parse(req.body.sharings)
          : req.body.sharings;

        // Validate and format sharings
        if (Array.isArray(parsedSharings)) {
          updateData.sharings = parsedSharings.map(s => ({
            type: s.type?.toLowerCase() === "ac" ? "AC" : "Non-AC",
            shareType: s.shareType,
            monthlyPrice: Number(s.monthlyPrice),
            dailyPrice: Number(s.dailyPrice)
          }));
        } else {
          return res.status(400).json({
            success: false,
            message: "Invalid sharings format - must be an array"
          });
        }
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          message: "Invalid JSON format in sharings field",
          error: parseError.message
        });
      }
    }

    // Handle images if files were uploaded
    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(f => `uploads/${f.filename}`);
    }

    // Update the hostel with proper options
    const updatedHostel = await Hostel.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
        returnDocument: 'after' // Fix for mongoose deprecation warning
      }
    );

    if (!updatedHostel) {
      return res.status(404).json({
        success: false,
        message: "Hostel not found after update"
      });
    }

    // 🔔 NOTIFICATION: Notify vendor about hostel update
    if (updatedHostel.vendorId) {
      await createVendorNotification(
        updatedHostel.vendorId,
        `Your hostel "${updatedHostel.name}" has been updated successfully.`,
        "info"
      );
    }

    // Format and return response
    res.json({
      success: true,
      message: "Updated successfully",
      hostel: formatHostel(updatedHostel, req)
    });

  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



// =============================================
// FIX 2: deleteHostelById
// BUG: findByIdAndDelete returns the deleted doc, but the code called
//       it without capturing the return value, so `hostel` was undefined
//       when the notification tried to use hostel.vendorId and hostel.name.
// =============================================
export const deleteHostelById = async (req, res) => {
  try {
    console.log("=== DELETE HOSTEL DEBUG ===");
    console.log("Request params:", req.params);
    console.log("Hostel ID:", req.params.id);

    // Try different deletion methods
    const id = req.params.id;

    // Method 1: Try findByIdAndDelete
    let result = await Hostel.findByIdAndDelete(id);
    console.log("Method 1 result:", result);

    // If Method 1 fails, try Method 2: find and remove
    if (!result) {
      const hostel = await Hostel.findById(id);
      console.log("Found hostel:", hostel);

      if (hostel) {
        result = await hostel.deleteOne();
        console.log("Method 2 result:", result);
      }
    }

    if (!result) {
      return res.status(404).json({
        success: false,
        message: `Hostel with ID ${id} not found`,
      });
    }

    res.json({
      success: true,
      message: "Deleted successfully",
    });

  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
      stack: err.stack
    });
  }
};




/* CREATE BANNER */

export const createBanner = async (req, res) => {
  try {

    const images = req.files.map(file => `uploads/${file.filename}`);

    const banner = await Banner.create({ images });

    const response = {
      ...banner._doc,
      images: banner.images.map(img => getImageUrl(req, img))
    };

    res.status(201).json({
      success: true,
      message: "Banner created successfully",
      banner: response
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};



/* GET ALL BANNERS */

export const getAllBanners = async (req, res) => {
  try {

    const banners = await Banner.find();

    const formatted = banners.map(banner => ({
      ...banner._doc,
      images: banner.images.map(img => getImageUrl(req, img))
    }));

    res.status(200).json({
      success: true,
      banners: formatted
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};



/* GET BANNER BY ID */

export const getBannerById = async (req, res) => {
  try {

    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found"
      });
    }

    const response = {
      ...banner._doc,
      images: banner.images.map(img => getImageUrl(req, img))
    };

    res.status(200).json({
      success: true,
      banner: response
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};



/* UPDATE BANNER */

export const updateBannerById = async (req, res) => {
  try {

    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found"
      });
    }

    let images = banner.images;

    if (req.files && req.files.length > 0) {
      images = req.files.map(file => `uploads/${file.filename}`);
    }

    const updated = await Banner.findByIdAndUpdate(
      req.params.id,
      { images },
      { new: true }
    );

    const response = {
      ...updated._doc,
      images: updated.images.map(img => getImageUrl(req, img))
    };

    res.status(200).json({
      success: true,
      message: "Banner updated successfully",
      banner: response
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};



/* DELETE BANNER */

export const deleteBannerById = async (req, res) => {
  try {

    const banner = await Banner.findByIdAndDelete(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Banner deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};




// =============================================================================
//  FORM SUBMISSION  ← HTML form POSTs here after QR scan
// =============================================================================
export const submitForm = async (req, res) => {
  try {
    console.log("📝 Form submission received");
    const {
      name,
      email,
      mobile,
      emergencyNumber,
      hostelId,
      roomNo,
      joiningDate,
      tenure,
      roomType,
      advance
    } = req.body;

    // Validate required fields
    if (!name || !email || !mobile || !hostelId || !roomNo || !joiningDate || !tenure || !roomType || !advance) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled: name, email, mobile, hostelId, roomNo, joiningDate, tenure, roomType, advance"
      });
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address"
      });
    }

    // Validate tenure enum
    if (!['monthly', 'daily'].includes(tenure)) {
      return res.status(400).json({
        success: false,
        message: "Tenure must be either 'monthly' or 'daily'"
      });
    }

    // Validate roomType enum
    if (!['AC', 'Non-AC'].includes(roomType)) {
      return res.status(400).json({
        success: false,
        message: "Room type must be either 'AC' or 'Non-AC'"
      });
    }

    // Validate advance is a number
    const advanceAmount = Number(advance);
    if (isNaN(advanceAmount) || advanceAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Advance amount must be a valid number greater than or equal to 0"
      });
    }

    // Handle file uploads
    const aadhar = req.files?.aadhar ? `uploads/${req.files.aadhar[0].filename}` : null;
    const idCard = req.files?.idCard ? `uploads/${req.files.idCard[0].filename}` : null;
    const profileImage = req.files?.profileImage ? `uploads/${req.files.profileImage[0].filename}` : null;

    // Create form with new fields
    const form = await FormUser.create({
      hostelId,
      name,
      email,
      mobile,
      emergencyNumber,
      aadhar,
      idCard,
      profileImage,
      roomNo,
      joiningDate: new Date(joiningDate),
      tenure,
      roomType,
      advance: advanceAmount
    });

    console.log("✅ Form saved:", form._id);

    res.json({
      success: true,
      message: "Form submitted successfully",
      data: form
    });
  } catch (err) {
    console.error("❌ Form error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// =============================================================================
//  QR CODE — standalone endpoints
// =============================================================================
export const generateQRCode = async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) return res.status(400).json({ success: false, message: "Data required" });
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(data));
    res.status(200).json({ success: true, qrCode: qrCodeDataURL });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const getQRCodeImage = async (req, res) => {
  try {
    const { hostelId } = req.params;
    const hostel = await Hostel.findById(hostelId);

    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: "Hostel not found"
      });
    }

    const baseUrl = getBaseUrl(req);
    const formUrl = `${baseUrl}/api/Admin/form/${hostelId}`;

    console.log("📱 Generating QR code for URL:", formUrl);
    console.log("🏠 Hostel:", hostel.name);

    const qrBuffer = await QRCode.toBuffer(formUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 500,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="qr-${hostel.name.replace(/\s/g, '-')}.png"`);
    res.send(qrBuffer);

  } catch (error) {
    console.error("QR generation error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Show QR code page with image
export const showQRCodePage = async (req, res) => {
  try {
    const { hostelId } = req.params;
    const hostel = await Hostel.findById(hostelId);

    if (!hostel) {
      return res.status(404).send(`
        <html>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h2>Hostel not found</h2>
          </body>
        </html>
      `);
    }

    const baseUrl = getBaseUrl(req);
    const qrImageUrl = `${baseUrl}/api/Admin/hostel/${hostelId}/qrcode`;
    const formUrl = `${baseUrl}/api/Admin/form/${hostelId}`;

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>QR Code - ${hostel.name}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
          }
          
          .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 550px;
            width: 100%;
          }
          
          h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
          }
          
          .hostel-name {
            color: #667eea;
            font-size: 18px;
            margin-bottom: 30px;
            font-weight: 600;
          }
          
          .qr-wrapper {
            background: white;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            margin: 20px 0;
            display: inline-block;
            border: 2px solid #e0e0e0;
          }
          
          .qr-code {
            max-width: 100%;
            height: auto;
            display: block;
          }
          
          .info-box {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            font-size: 12px;
            word-break: break-all;
            text-align: left;
          }
          
          .info-box strong {
            color: #333;
            display: block;
            margin-bottom: 8px;
          }
          
          .button-group {
            margin: 20px 0;
          }
          
          .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 8px;
            margin: 5px;
            transition: transform 0.2s, background 0.2s;
            cursor: pointer;
            border: none;
            font-size: 14px;
            font-weight: 600;
          }
          
          .button:hover {
            transform: translateY(-2px);
            background: #5a67d8;
          }
          
          .button-primary {
            background: #28a745;
          }
          
          .button-primary:hover {
            background: #218838;
          }
          
          .button-secondary {
            background: #17a2b8;
          }
          
          .button-secondary:hover {
            background: #138496;
          }
          
          .instructions {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            text-align: left;
          }
          
          .instructions h3 {
            font-size: 16px;
            margin-bottom: 10px;
            color: #333;
          }
          
          .instructions ol {
            margin-left: 20px;
            color: #666;
            line-height: 1.6;
          }
          
          .instructions li {
            margin: 8px 0;
          }
          
          @media print {
            .button-group, .instructions, .info-box {
              display: none;
            }
            .container {
              box-shadow: none;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🏠 ${hostel.name}</h1>
          <div class="hostel-name">Registration QR Code</div>
          
          <div class="qr-wrapper">
            <img src="${qrImageUrl}" alt="Scan to register" class="qr-code" id="qrImage" />
          </div>
          
          <div class="info-box">
            <strong>🔗 Registration Link:</strong>
            <small>${formUrl}</small>
          </div>
          
          <div class="button-group">
            <a href="${formUrl}" class="button button-primary" target="_blank">📝 Open Registration Form</a>
            <button onclick="downloadQR()" class="button">💾 Download QR Code</button>
            <button onclick="window.print()" class="button button-secondary">🖨️ Print QR Code</button>
          </div>
          
          <div class="instructions">
            <h3>📱 How to use this QR code:</h3>
            <ol>
              <li><strong>For guests:</strong> Scan this QR code with their phone camera or Google Lens</li>
              <li><strong>Auto-open:</strong> The registration form will automatically open in their browser</li>
              <li><strong>Fill form:</strong> Guests enter their details and upload documents</li>
              <li><strong>Submit:</strong> Their information is securely saved in the system</li>
              <li><strong>Notification:</strong> You'll be notified when someone registers</li>
            </ol>
            <p style="margin-top: 15px; color: #28a745; font-weight: 500;">✅ No app needed - just scan with any QR reader!</p>
          </div>
        </div>
        
        <script>
          function downloadQR() {
            const qrImage = document.getElementById('qrImage');
            const link = document.createElement('a');
            link.download = 'qr-${hostel.name.replace(/\s/g, '-')}.png';
            link.href = qrImage.src;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("QR page error:", error);
    res.status(500).send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2>Error generating QR code</h2>
          <p>${error.message}</p>
        </body>
      </html>
    `);
  }
};

// Add this to your adminController.js
export const getQRCodeForHostel = async (req, res) => {
  try {
    const { hostelId } = req.params;
    const hostel = await Hostel.findById(hostelId);

    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: "Hostel not found"
      });
    }

    const baseUrl = getBaseUrl(req);
    const formUrl = `${baseUrl}/api/Admin/form/${hostelId}`;

    // Generate QR code as PNG buffer
    const qrBuffer = await QRCode.toBuffer(formUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 500,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    // Set headers for image download
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="qr-${hostel.name.replace(/\s/g, '-')}.png"`);
    res.send(qrBuffer);

  } catch (error) {
    console.error("QR generation error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getHostelQRCodeImage = async (req, res) => {
  try {
    const { hostelId } = req.params;
    const hostel = await Hostel.findById(hostelId);

    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: "Hostel not found"
      });
    }

    // Get the form URL
    const baseUrl = getBaseUrl(req);
    const formUrl = `${baseUrl}/api/Admin/form/${hostelId}`;

    console.log("Generating QR code for URL:", formUrl);

    // Generate QR code as PNG buffer
    const qrBuffer = await QRCode.toBuffer(formUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 500,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    // Set headers to display as image
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="qr-${hostel.name.replace(/\s/g, '-')}.png"`);
    res.send(qrBuffer);

  } catch (error) {
    console.error("QR generation error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



// Get all form submissions
export const getAllFormSubmissions = async (req, res) => {
  try {
    const forms = await FormUser.find()
      .populate('hostelId', 'name address') // Get hostel details
      .sort({ submittedAt: -1 }); // Latest first

    // Format the response with null checks
    const formattedForms = forms.map(form => ({
      _id: form._id,
      hostel: form.hostelId ? {  // Check if hostelId exists
        id: form.hostelId._id,
        name: form.hostelId.name,
        address: form.hostelId.address
      } : {
        id: form.hostelId, // Return the raw ID if population failed
        name: 'Hostel not found',
        address: 'N/A'
      },
      guest: {
        name: form.name,
        email: form.email,
        mobile: form.mobile,
        emergencyNumber: form.emergencyNumber || 'Not provided'
      },
      stayDetails: {
        roomNo: form.roomNo,
        joiningDate: form.joiningDate,
        tenure: form.tenure,
        roomType: form.roomType,
        advance: form.advance
      },
      documents: {
        aadhar: form.aadhar ? getImageUrl(req, form.aadhar) : null,
        idCard: form.idCard ? getImageUrl(req, form.idCard) : null,
        profileImage: form.profileImage ? getImageUrl(req, form.profileImage) : null
      },
      submittedAt: form.submittedAt
    }));

    res.status(200).json({
      success: true,
      count: forms.length,
      submissions: formattedForms
    });

  } catch (error) {
    console.error("Error fetching forms:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get form submissions by hostel ID
export const getFormSubmissionsByHostel = async (req, res) => {
  try {
    const { hostelId } = req.params;

    const forms = await FormUser.find({ hostelId })
      .populate('hostelId', 'name address')
      .sort({ submittedAt: -1 });

    const formattedForms = forms.map(form => ({
      _id: form._id,
      hostel: form.hostelId ? {
        id: form.hostelId._id,
        name: form.hostelId.name,
        address: form.hostelId.address
      } : {
        id: hostelId,
        name: 'Hostel not found',
        address: 'N/A'
      },
      guest: {
        name: form.name,
        email: form.email,
        mobile: form.mobile,
        emergencyNumber: form.emergencyNumber || 'Not provided'
      },
      stayDetails: {
        roomNo: form.roomNo,
        joiningDate: form.joiningDate,
        tenure: form.tenure,
        roomType: form.roomType,
        advance: form.advance
      },
      documents: {
        aadhar: form.aadhar ? getImageUrl(req, form.aadhar) : null,
        idCard: form.idCard ? getImageUrl(req, form.idCard) : null,
        profileImage: form.profileImage ? getImageUrl(req, form.profileImage) : null
      },
      submittedAt: form.submittedAt
    }));

    res.status(200).json({
      success: true,
      count: forms.length,
      hostelId: hostelId,
      submissions: formattedForms
    });

  } catch (error) {
    console.error("Error fetching forms by hostel:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================================================================
// UPDATE FORM SUBMISSION - UPDATE ALL EXCEPT ROOM NUMBER
// =============================================================================
export const updateFormSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fields that can be updated (excluding roomNo)
    const {
      name,
      email,
      mobile,
      emergencyNumber,
      joiningDate,
      tenure,
      roomType,
      advance,
      hostelId
    } = req.body;

    // Find existing form submission
    const existingForm = await FormUser.findById(id);
    if (!existingForm) {
      return res.status(404).json({
        success: false,
        message: "Form submission not found"
      });
    }

    // Prepare update data (excluding roomNo)
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (emergencyNumber !== undefined) updateData.emergencyNumber = emergencyNumber;
    if (joiningDate !== undefined) updateData.joiningDate = new Date(joiningDate);
    if (tenure !== undefined) {
      if (!['monthly', 'daily'].includes(tenure)) {
        return res.status(400).json({
          success: false,
          message: "Tenure must be either 'monthly' or 'daily'"
        });
      }
      updateData.tenure = tenure;
    }
    if (roomType !== undefined) {
      if (!['AC', 'Non-AC'].includes(roomType)) {
        return res.status(400).json({
          success: false,
          message: "Room type must be either 'AC' or 'Non-AC'"
        });
      }
      updateData.roomType = roomType;
    }
    if (advance !== undefined) {
      const advanceAmount = Number(advance);
      if (isNaN(advanceAmount) || advanceAmount < 0) {
        return res.status(400).json({
          success: false,
          message: "Advance amount must be a valid number greater than or equal to 0"
        });
      }
      updateData.advance = advanceAmount;
    }
    if (hostelId !== undefined) updateData.hostelId = hostelId;

    // Handle file uploads (if any)
    if (req.files) {
      if (req.files.aadhar) {
        updateData.aadhar = `uploads/${req.files.aadhar[0].filename}`;
      }
      if (req.files.idCard) {
        updateData.idCard = `uploads/${req.files.idCard[0].filename}`;
      }
      if (req.files.profileImage) {
        updateData.profileImage = `uploads/${req.files.profileImage[0].filename}`;
      }
    }

    // Update the form submission
    const updatedForm = await FormUser.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('hostelId', 'name address');

    // Format response
    const formattedResponse = {
      _id: updatedForm._id,
      hostel: updatedForm.hostelId ? {
        id: updatedForm.hostelId._id,
        name: updatedForm.hostelId.name,
        address: updatedForm.hostelId.address
      } : {
        id: updatedForm.hostelId,
        name: 'Hostel not found',
        address: 'N/A'
      },
      guest: {
        name: updatedForm.name,
        email: updatedForm.email,
        mobile: updatedForm.mobile,
        emergencyNumber: updatedForm.emergencyNumber || 'Not provided'
      },
      stayDetails: {
        roomNo: updatedForm.roomNo, // Room number remains unchanged
        joiningDate: updatedForm.joiningDate,
        tenure: updatedForm.tenure,
        roomType: updatedForm.roomType,
        advance: updatedForm.advance
      },
      documents: {
        aadhar: updatedForm.aadhar ? getImageUrl(req, updatedForm.aadhar) : null,
        idCard: updatedForm.idCard ? getImageUrl(req, updatedForm.idCard) : null,
        profileImage: updatedForm.profileImage ? getImageUrl(req, updatedForm.profileImage) : null
      },
      submittedAt: updatedForm.submittedAt,
      updatedAt: updatedForm.updatedAt
    };

    res.status(200).json({
      success: true,
      message: "Form submission updated successfully (room number unchanged)",
      submission: formattedResponse
    });

  } catch (error) {
    console.error("Error updating form submission:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================================================================
// UPDATE FORM SUBMISSION - UPDATE ONLY ROOM NUMBER
// =============================================================================
export const updateFormRoomNumber = async (req, res) => {
  try {
    const { id } = req.params;
    const { roomNo } = req.body;

    // Validate room number
    if (!roomNo) {
      return res.status(400).json({
        success: false,
        message: "Room number is required"
      });
    }

    // Find existing form submission
    const existingForm = await FormUser.findById(id);
    if (!existingForm) {
      return res.status(404).json({
        success: false,
        message: "Form submission not found"
      });
    }

    // Update only the room number
    const updatedForm = await FormUser.findByIdAndUpdate(
      id,
      { roomNo: roomNo.trim() },
      { new: true, runValidators: true }
    ).populate('hostelId', 'name address');

    // Format response
    const formattedResponse = {
      _id: updatedForm._id,
      hostel: updatedForm.hostelId ? {
        id: updatedForm.hostelId._id,
        name: updatedForm.hostelId.name,
        address: updatedForm.hostelId.address
      } : {
        id: updatedForm.hostelId,
        name: 'Hostel not found',
        address: 'N/A'
      },
      guest: {
        name: updatedForm.name,
        email: updatedForm.email,
        mobile: updatedForm.mobile,
        emergencyNumber: updatedForm.emergencyNumber || 'Not provided'
      },
      stayDetails: {
        roomNo: updatedForm.roomNo, // Updated room number
        joiningDate: updatedForm.joiningDate,
        tenure: updatedForm.tenure,
        roomType: updatedForm.roomType,
        advance: updatedForm.advance
      },
      documents: {
        aadhar: updatedForm.aadhar ? getImageUrl(req, updatedForm.aadhar) : null,
        idCard: updatedForm.idCard ? getImageUrl(req, updatedForm.idCard) : null,
        profileImage: updatedForm.profileImage ? getImageUrl(req, updatedForm.profileImage) : null
      },
      submittedAt: updatedForm.submittedAt,
      updatedAt: updatedForm.updatedAt
    };

    res.status(200).json({
      success: true,
      message: "Room number updated successfully",
      submission: formattedResponse
    });

  } catch (error) {
    console.error("Error updating room number:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================================================================
// DELETE FORM SUBMISSION
// =============================================================================
export const deleteFormSubmission = async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete the form submission
    const deletedForm = await FormUser.findByIdAndDelete(id);
    
    if (!deletedForm) {
      return res.status(404).json({
        success: false,
        message: "Form submission not found"
      });
    }

    // Optional: Delete associated files from storage
    // You might want to delete the uploaded files from the filesystem
    const filesToDelete = [
      deletedForm.aadhar,
      deletedForm.idCard,
      deletedForm.profileImage
    ].filter(file => file);

    // Uncomment if you want to delete actual files
    // filesToDelete.forEach(filePath => {
    //   const fullPath = path.join(process.cwd(), filePath);
    //   if (fs.existsSync(fullPath)) {
    //     fs.unlinkSync(fullPath);
    //   }
    // });

    res.status(200).json({
      success: true,
      message: "Form submission deleted successfully",
      deletedSubmission: {
        _id: deletedForm._id,
        guestName: deletedForm.name,
        hostelId: deletedForm.hostelId,
        roomNo: deletedForm.roomNo
      }
    });

  } catch (error) {
    console.error("Error deleting form submission:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================================================================
// GET SINGLE FORM SUBMISSION BY ID
// =============================================================================
export const getFormSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;

    const form = await FormUser.findById(id)
      .populate('hostelId', 'name address');

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form submission not found"
      });
    }

    const formattedResponse = {
      _id: form._id,
      hostel: form.hostelId ? {
        id: form.hostelId._id,
        name: form.hostelId.name,
        address: form.hostelId.address
      } : {
        id: form.hostelId,
        name: 'Hostel not found',
        address: 'N/A'
      },
      guest: {
        name: form.name,
        email: form.email,
        mobile: form.mobile,
        emergencyNumber: form.emergencyNumber || 'Not provided'
      },
      stayDetails: {
        roomNo: form.roomNo,
        joiningDate: form.joiningDate,
        tenure: form.tenure,
        roomType: form.roomType,
        advance: form.advance
      },
      documents: {
        aadhar: form.aadhar ? getImageUrl(req, form.aadhar) : null,
        idCard: form.idCard ? getImageUrl(req, form.idCard) : null,
        profileImage: form.profileImage ? getImageUrl(req, form.profileImage) : null
      },
      submittedAt: form.submittedAt,
      updatedAt: form.updatedAt
    };

    res.status(200).json({
      success: true,
      submission: formattedResponse
    });

  } catch (error) {
    console.error("Error fetching form submission:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
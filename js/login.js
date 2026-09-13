const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const toggle = document.getElementById('toggleRegister');
const errorBox = document.getElementById('authError');

function showError(message){
  if(!errorBox) return alert(message);
  errorBox.textContent=message;
  errorBox.style.display='block';
}
function clearError(){ if(errorBox) errorBox.style.display='none'; }

function saveUser(user, profile){
  localStorage.setItem('documentVaultLoggedIn','true');
  localStorage.setItem('documentVaultUser',user.email||'');
  localStorage.setItem('documentVaultUserName',profile?.name||user.displayName||'User');
}

if(toggle){
  toggle.addEventListener('click',()=>{
    clearError();
    const registering = registerForm.style.display === 'none';
    registerForm.style.display = registering ? 'block' : 'none';
    loginForm.style.display = registering ? 'none' : 'block';
    toggle.textContent = registering ? 'Already have an account? Login' : 'Create an account';
  });
}

(async function redirectIfAlreadyLoggedIn(){
  try {
    await window.firebaseReady;
    const user = await getCurrentFirebaseUser();
    if(user) window.location.href='dashboard.html';
  } catch (e) {
    if (window.firebaseConfigError) showError(window.firebaseConfigError);
  }
})();

loginForm?.addEventListener('submit', async (e)=>{
  e.preventDefault(); clearError();
  const email=document.getElementById('email').value.trim();
  const password=document.getElementById('password').value;
  const remember=document.getElementById('rememberMe')?.checked;
  if(!email || !password) return showError('Email and password are required.');
  if(!/^\S+@\S+\.\S+$/.test(email)) return showError('Please enter a valid email address.');
  const b=loginForm.querySelector('button[type=submit]');
  b.disabled=true; b.textContent='Signing in...';
  try{
    await window.firebaseReady;
    await firebaseAuth.setPersistence(remember ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION);
    const credential=await firebaseAuth.signInWithEmailAndPassword(email,password);
    const profile=await getUserProfile(credential.user);
    saveUser(credential.user,profile);
    window.location.href='dashboard.html';
  }catch(err){ showError(authErrorMessage(err)); }
  finally{ b.disabled=false; b.textContent='Login'; }
});

registerForm?.addEventListener('submit', async (e)=>{
  e.preventDefault(); clearError();
  const name=document.getElementById('registerName').value.trim();
  const email=document.getElementById('registerEmail').value.trim();
  const password=document.getElementById('registerPassword').value;
  const confirm=document.getElementById('registerConfirm').value;
  if(!name || !email || !password || !confirm) return showError('All fields are required.');
  if(!/^\S+@\S+\.\S+$/.test(email)) return showError('Please enter a valid email address.');
  if(password.length<6) return showError('Password must be at least 6 characters.');
  if(password!==confirm) return showError('Passwords do not match.');
  const b=registerForm.querySelector('button[type=submit]');
  b.disabled=true; b.textContent='Creating account...';
  try{
    await window.firebaseReady;
    const credential=await firebaseAuth.createUserWithEmailAndPassword(email,password);
    await credential.user.updateProfile({displayName:name});
    const profile={name,email,role:'user',createdAt:firebase.firestore.FieldValue.serverTimestamp()};
    await firebaseDb.collection('users').doc(credential.user.uid).set(profile,{merge:true});
    saveUser(credential.user,{name});
    window.location.href='dashboard.html';
  }catch(err){ showError(authErrorMessage(err)); }
  finally{ b.disabled=false; b.textContent='Create Account'; }
});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/javascript");

  const { agencyId, agencyName, agentName, branchId } = req.query;

  const widgetCode = `
(function() {
  const CONFIG = {
    agencyId: "${agencyId || ''}",
    agencyName: "${agencyName || 'notre agence'}",
    agentName: "${agentName || 'Sofia'}",
    branchId: "${branchId || ''}",
    apiUrl: "https://" + location.host.replace(location.host, '${process.env.VERCEL_URL || 'leadzia-backend.vercel.app'}')
  };

  // Styles
  const style = document.createElement('style');
  style.textContent = \`
    #lz-bubble {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      width: 58px; height: 58px; border-radius: 50%;
      background: linear-gradient(135deg, #b8935a, #8b6534);
      box-shadow: 0 4px 20px rgba(184,147,90,.5);
      border: none; cursor: pointer; font-size: 24px;
      display: flex; align-items: center; justify-content: center;
      transition: all .3s; animation: lzPop .6s cubic-bezier(.34,1.56,.64,1);
    }
    @keyframes lzPop { from{opacity:0;transform:scale(0)} to{opacity:1;transform:scale(1)} }
    #lz-bubble:hover { transform: scale(1.1); }
    #lz-label {
      position: fixed; bottom: 30px; right: 90px; z-index: 9999;
      background: #fff; border: 1px solid rgba(0,0,0,.12);
      border-radius: 20px; padding: 8px 16px;
      font-family: sans-serif; font-size: 13px; font-weight: 500;
      box-shadow: 0 4px 16px rgba(0,0,0,.1); cursor: pointer;
      white-space: nowrap; animation: lzFadeIn .4s 1s ease both;
    }
    @keyframes lzFadeIn { from{opacity:0;transform:translateX(10px)} to{opacity:1;transf

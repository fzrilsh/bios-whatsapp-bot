import{logger as r}from"../utils/logger.js";const i={name:"logs",description:"System logs",withPrefix:!0,mustOwner:!0,execute:async({m:e,args:n})=>{const a=r.getRuntimeLogs(10);switch(n[0]){case"msg":e.reply(JSON.stringify(e,null,2));break;case"show":if(a.length===0)return e.reply("Belum ada error di runtime saat ini.");await e.reply(`\u26A0\uFE0F *RUNTIME ERROR LOGS* \u26A0\uFE0F

${a.map((t,s)=>`${s+1}. *[${t.context}]* _${t.timestamp}_
> ${t.message}`).join(`

`)}`);break;case"clear":r.clearRuntimeLogs(),await e.reply("Berhasil clear logs di runtime saat ini.");break;default:break}}};var u=i;export{u as default};
//# sourceMappingURL=logs.command.js.map
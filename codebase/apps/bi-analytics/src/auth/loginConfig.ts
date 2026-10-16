export function resolveEndpoint(value:string|undefined,origin:string):string|undefined {
 if(!value?.trim())return undefined
 const url=new URL(value.trim(),origin)
 if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw new Error('La URL de autenticación o estado debe usar HTTP(S) y no contener credenciales.')
 return url.href
}

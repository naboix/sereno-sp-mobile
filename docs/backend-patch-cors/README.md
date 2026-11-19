# Patch OPCIONAL de CORS na Sereno.Api

**Para que serve:** permitir que a versão **web** do app (`npm run web` / `expo export -p web`) chame a API a partir de outra origem (porta). No **celular** (Expo Go, Android, iOS) o patch é desnecessário, porque apps nativos não aplicam CORS.

**O que muda:** apenas `Sereno.Api/Program.cs`, com 2 trechos aditivos. Nenhum endpoint, regra de negócio, DTO ou migration é alterado. A origem liberada vem da configuração (`Cors:Origens`). Sem essa configuração, nada é liberado.

## Como aplicar

```bash
cd sereno-sp/Sereno.Api
git apply caminho/para/cors.patch        # ou edite manualmente conforme abaixo
```

Em `appsettings.Development.json` (somente desenvolvimento):

```json
"Cors": { "Origens": [ "http://localhost:8081" ] }
```

## Edição manual equivalente (Program.cs)

Depois de `builder.Services.AddAuthorization();`:

```csharp
var origensCors = builder.Configuration.GetSection("Cors:Origens").Get<string[]>() ?? [];
builder.Services.AddCors(o => o.AddPolicy("AppSereno", p =>
    p.WithOrigins(origensCors).WithMethods("GET").AllowAnyHeader()));
```

Antes de `app.UseAuthorization();`:

```csharp
app.UseCors("AppSereno");
```

Só o método GET é liberado, porque o app só lê dados.

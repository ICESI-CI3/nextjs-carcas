export default function ForbiddenPage(){
  return (
    <div className="mx-auto mt-24 max-w-xl rounded border bg-white p-8 text-center shadow">
      <h1 className="text-3xl font-bold text-red-600">403</h1>
      <p className="mt-4 text-sm text-gray-600">No tienes permisos para acceder a este recurso.</p>
      <p className="mt-2 text-sm text-gray-500">Si consideras que es un error, contacta al personal de biblioteca.</p>
    </div>
  )
}

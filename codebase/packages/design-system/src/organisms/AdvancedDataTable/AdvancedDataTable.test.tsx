import {cleanup,render,screen,within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {afterEach,describe,it,expect} from 'vitest'
import {AdvancedDataTable} from './AdvancedDataTable'

describe('AdvancedDataTable interactions',()=>{
 afterEach(cleanup)
 const rows=Array.from({length:8},(_,i)=>({id:i,name:'Cliente '+(i+1),amount:80-i*10,status:i%2?'Pendiente':'Pagado'}))
 const columns=[{key:'name',label:'Cliente'},{key:'amount',label:'Monto'},{key:'status',label:'Estado'}] as const
 it('paginates actual rows and resets the page when filtering',async()=>{
  const user=userEvent.setup()
  render(<AdvancedDataTable title="Transacciones" total={8} rows={rows} columns={[...columns]}/>)
  expect(screen.queryByText('Cliente 6')).not.toBeInTheDocument()
  await user.click(screen.getByRole('button',{name:'Siguiente ›'}))
  expect(screen.getByText('Cliente 6')).toBeInTheDocument()
  expect(screen.queryByText('Cliente 1')).not.toBeInTheDocument()
  await user.type(screen.getByRole('textbox',{name:'Buscar registros'}),'Cliente 1')
  expect(screen.getByText('Cliente 1')).toBeInTheDocument()
  expect(screen.queryByText('Cliente 6')).not.toBeInTheDocument()
 })
 it('sorts numeric values in both directions and exposes aria-sort',async()=>{
  const user=userEvent.setup()
  render(<AdvancedDataTable title="Transacciones" total={8} rows={rows} columns={[...columns]}/>)
  const sort=screen.getByRole('button',{name:/Monto/})
  await user.click(sort)
  expect(sort.closest('th')).toHaveAttribute('aria-sort','ascending')
  expect(within(screen.getAllByRole('row')[1]).getByText('Cliente 8')).toBeInTheDocument()
  await user.click(sort)
  expect(sort.closest('th')).toHaveAttribute('aria-sort','descending')
  expect(within(screen.getAllByRole('row')[1]).getByText('Cliente 1')).toBeInTheDocument()
 })
 it('selects the visible page without selecting hidden rows',async()=>{
  const user=userEvent.setup()
  render(<AdvancedDataTable title="Transacciones" total={8} rows={rows} columns={[...columns]}/>)
  await user.click(screen.getByRole('checkbox',{name:'Seleccionar página'}))
  expect(screen.getByText(/5 seleccionados/)).toBeInTheDocument()
  await user.click(screen.getByRole('button',{name:'Siguiente ›'}))
  expect(screen.getByRole('checkbox',{name:'Seleccionar página'})).not.toBeChecked()
 })
})

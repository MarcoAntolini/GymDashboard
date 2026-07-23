"use client";

import ItemActions from "@/components/ui/data-table/table-item-actions";
import { TableSortableHeader } from "@/components/ui/data-table/table-sortable-header";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Client } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, CalendarDays, Hash, IdCard, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { formatDateIt } from "@/lib/format";
import { cn } from "@/lib/utils";

export const formSchema = z.object({
  taxCode: z.string().min(1, "Il codice fiscale è obbligatorio"),
  name: z.string().min(1, "Il nome è obbligatorio"),
  surname: z.string().min(1, "Il cognome è obbligatorio"),
  birthDate: z.date(),
  street: z.string().min(1, "La via è obbligatoria"),
  houseNumber: z.string().min(1, "Il numero civico è obbligatorio"),
  city: z.string().min(1, "La città è obbligatoria"),
  province: z.string().min(1, "La provincia è obbligatoria"),
  phoneNumber: z.string().min(1, "Il telefono è obbligatorio"),
  email: z.string().email("Indirizzo email non valido"),
  enrollmentDate: z.date(),
});

export const columns = (
  handleDelete: (client: Pick<Client, "id">) => Promise<void>,
  handleEdit: (client: Client) => Promise<void>
): ColumnDef<Client>[] => [
  {
    accessorKey: "surname",
    header: ({ column }) => (
      <TableSortableHeader column={column} title="Cognome" icon={UserRound} />
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <TableSortableHeader column={column} title="Nome" icon={UserRound} />
    ),
  },
  {
    accessorKey: "taxCode",
    header: ({ column }) => (
      <TableSortableHeader column={column} title="Codice fiscale" icon={IdCard} />
    ),
  },
  {
    accessorKey: "phoneNumber",
    header: ({ column }) => (
      <TableSortableHeader column={column} title="Telefono" icon={Phone} />
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <TableSortableHeader column={column} title="Email" icon={Mail} />
    ),
  },
  {
    accessorKey: "birthDate",
    header: ({ column }) => (
      <TableSortableHeader column={column} title="Data di nascita" icon={CalendarDays} />
    ),
    cell: ({ row }) => {
      return <div className="font-medium">{formatDateIt(row.getValue("birthDate"))}</div>;
    },
  },
  {
    accessorKey: "city",
    header: ({ column }) => (
      <TableSortableHeader column={column} title="Città" icon={MapPin} />
    ),
  },
  {
    accessorKey: "province",
    header: ({ column }) => (
      <TableSortableHeader column={column} title="Provincia" icon={MapPin} />
    ),
  },
  {
    accessorKey: "enrollmentDate",
    header: ({ column }) => (
      <TableSortableHeader column={column} title="Iscrizione" icon={CalendarDays} />
    ),
    cell: ({ row }) => {
      return <div className="font-medium">{formatDateIt(row.getValue("enrollmentDate"))}</div>;
    },
  },
  {
    accessorKey: "id",
    header: ({ column }) => (
      <TableSortableHeader column={column} title="ID" icon={Hash} />
    ),
    enableHiding: true,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <ItemActions
        row={row}
        formSchema={formSchema}
        entityLabel="Cliente"
        deleteDescription="Se il Cliente ha Acquisti collegati, l'eliminazione viene rifiutata (vincolo Restrict): elimina prima gli Acquisti (e gli Ingressi collegati). L'operazione non può essere annullata."
        editFormContent={
          <>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="surname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cognome</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="taxCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Codice fiscale</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data di nascita</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              formatDateIt(field.value)
                            ) : (
                              <span>Scegli una data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <FormField
                name="street"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel>Via</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="houseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Civico</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Città</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="province"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provincia</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-8 gap-4">
              <FormField
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel>Telefono</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="email"
                render={({ field }) => (
                  <FormItem className="col-span-5">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              name="enrollmentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data di iscrizione</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            formatDateIt(field.value)
                          ) : (
                            <span>Scegli una data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        }
        editAction={async ({ values }) => {
          const updatedClient = {
            ...row.original,
            ...values,
          };
          await handleEdit(updatedClient);
        }}
        deleteAction={() => handleDelete({ id: row.original.id })}
      />
    ),
  },
];
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
import { CalendarIcon, Hash, IdCard, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { formatDateIt } from "@/lib/format/locale";
import { cn } from "@/lib/utils";

// All list columns are nativa (VIEW_COLUMN_MATRIX.clienti). Residuo ingressi is
// never a Cliente attribute — see remainingEntrances on Acquisto (derivata).

export const formSchema = z.object({
  taxCode: z.string().min(1, "Tax Code is required"),
  name: z.string().min(1, "Name is required"),
  surname: z.string().min(1, "Surname is required"),
  birthDate: z.date(),
  street: z.string().min(1, "Street is required"),
  houseNumber: z.string().min(1, "House Number is required"),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province is required"),
  phoneNumber: z.string().min(1, "Phone Number is required"),
  email: z.string().email("Invalid email address"),
  enrollmentDate: z.date(),
});

export const columns = (
  handleDelete: (client: Pick<Client, "id">) => Promise<void>,
  handleEdit: (client: Client) => Promise<void>
): ColumnDef<Client>[] => [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <TableSortableHeader
        column={column}
        title="ID"
        icon={Hash}
      />
    ),
  },
  {
    accessorKey: "taxCode",
    header: ({ column }) => (
      <TableSortableHeader
        column={column}
        title="Codice fiscale"
        icon={IdCard}
      />
    ),
  },
  {
    accessorKey: "surname",
    header: ({ column }) => (
      <TableSortableHeader
        column={column}
        title="Cognome"
        icon={UserRound}
      />
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <TableSortableHeader
        column={column}
        title="Nome"
        icon={UserRound}
      />
    ),
  },
  {
    accessorKey: "birthDate",
    header: ({ column }) => (
      <TableSortableHeader
        column={column}
        title="Data di nascita"
        icon={CalendarIcon}
      />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("birthDate"));
      return <div className="font-medium">{formatDateIt(date)}</div>;
    },
  },
  {
    accessorKey: "city",
    header: ({ column }) => (
      <TableSortableHeader
        column={column}
        title="Città"
        icon={MapPin}
      />
    ),
  },
  {
    accessorKey: "province",
    header: ({ column }) => (
      <TableSortableHeader
        column={column}
        title="Provincia"
        icon={MapPin}
      />
    ),
  },
  {
    accessorKey: "phoneNumber",
    header: ({ column }) => (
      <TableSortableHeader
        column={column}
        title="Telefono"
        icon={Phone}
      />
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <TableSortableHeader
        column={column}
        title="Email"
        icon={Mail}
      />
    ),
  },
  {
    accessorKey: "enrollmentDate",
    header: ({ column }) => (
      <TableSortableHeader
        column={column}
        title="Iscrizione"
        icon={CalendarIcon}
      />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("enrollmentDate"));
      return <div className="font-medium">{formatDateIt(date)}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <ItemActions
        row={row}
        formSchema={formSchema}
        entityLabel="Cliente"
        deleteConsequence="Impossibile eliminare il Cliente se esistono Acquisti collegati (vincolo Restrict)."
        editFormContent={
          <>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
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
                    <FormLabel>Surname</FormLabel>
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
                    <FormLabel>Tax Code</FormLabel>
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
                    <FormLabel>Birth Date</FormLabel>
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
                              <span>Pick a date</span>
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
                    <FormLabel>Street</FormLabel>
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
                    <FormLabel>Number</FormLabel>
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
                    <FormLabel>City</FormLabel>
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
                    <FormLabel>Province</FormLabel>
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
                    <FormLabel>Phone Number</FormLabel>
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
                  <FormLabel>Enrollment Date</FormLabel>
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
                            <span>Pick a date</span>
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

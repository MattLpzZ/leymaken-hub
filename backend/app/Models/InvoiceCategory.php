<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InvoiceCategory extends Model
{
    protected $table = 'invoice_categories';

    protected $fillable = ['name', 'color', 'description'];
}

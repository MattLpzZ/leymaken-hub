<?php

namespace App\Http\Controllers;

use App\Models\CompanyUser;
use App\Models\SaasCompany;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SaasCompanyController extends Controller
{
    public function index()
    {
        return response()->json(
            SaasCompany::with(['plan', 'adminUser'])->withCount('users')->orderBy('name')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'          => 'required|string|max:150',
            'subdomain'     => 'required|string|max:100|unique:saas_companies',
            'plan_id'       => 'nullable|exists:saas_plans,id',
            'status'        => 'in:trial,active,suspended,cancelled',
            'trial_ends_at' => 'nullable|date',
            'contact_email' => 'nullable|email',
            'contact_phone' => 'nullable|string',
            'notes'         => 'nullable|string',
        ]);

        $company = SaasCompany::create($data);
        $company->load('plan');
        $company->syncSuitesFromPlan();

        $tempPassword = Str::password(12);
        $adminEmail   = 'admin@' . $company->subdomain . '.leymaken.com';

        CompanyUser::create([
            'company_id' => $company->id,
            'name'       => 'Administrador',
            'email'      => $adminEmail,
            'password'   => $tempPassword,
            'role'       => 'admin',
        ]);

        $company->load(['plan', 'adminUser']);

        return response()->json(array_merge($company->toArray(), [
            'admin_email'    => $adminEmail,
            'admin_password' => $tempPassword,
            '_notice'        => 'Guarda esta contraseña. No se mostrará de nuevo.',
        ]), 201);
    }

    public function update(Request $request, $id)
    {
        $company = SaasCompany::findOrFail($id);

        $data = $request->validate([
            'name'          => 'sometimes|string|max:150',
            'plan_id'       => 'nullable|exists:saas_plans,id',
            'contact_email' => 'nullable|email',
            'contact_phone' => 'nullable|string',
            'notes'         => 'nullable|string',
        ]);

        $hadPlan = $company->plan_id;
        $company->update($data);
        $company->load('plan');

        if (isset($data['plan_id']) && $data['plan_id'] !== $hadPlan) {
            $company->syncSuitesFromPlan();
        }

        return response()->json($company);
    }

    public function suspend($id)
    {
        $company = SaasCompany::findOrFail($id);
        $company->update(['status' => 'suspended']);
        return response()->json($company);
    }

    public function activate($id)
    {
        $company = SaasCompany::findOrFail($id);
        $company->update(['status' => 'active']);
        return response()->json($company);
    }

    public function destroy($id)
    {
        $company = SaasCompany::findOrFail($id);

        CompanyUser::where('company_id', $company->id)->each(function ($user) {
            $user->tokens()->delete();
            $user->delete();
        });

        $company->delete();
        return response()->json(null, 204);
    }

    public function users($id)
    {
        $company = SaasCompany::findOrFail($id);

        return response()->json(
            CompanyUser::where('company_id', $company->id)
                ->select('id', 'name', 'email', 'role', 'active', 'last_login_at', 'created_at')
                ->orderBy('name')
                ->get()
        );
    }

    public function resetPassword($id, $userId)
    {
        $company = SaasCompany::findOrFail($id);
        $user    = CompanyUser::where('company_id', $company->id)->findOrFail($userId);

        $newPassword = Str::password(12);
        $user->update(['password' => $newPassword]);
        $user->tokens()->delete();

        return response()->json([
            'message'      => 'Contraseña actualizada y sesiones revocadas.',
            'new_password' => $newPassword,
        ]);
    }
}

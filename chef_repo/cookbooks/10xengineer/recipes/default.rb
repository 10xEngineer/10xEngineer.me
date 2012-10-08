# 10xengineer::default

%w{bcrypt unzip zip}.each do |pkg_name|
	package pkg_name do
		action :install
	end
end